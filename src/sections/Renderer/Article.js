import React, { Component } from "react";

import Remarkable from "remarkable";
import { Link } from "react-router-dom";
import styled from "styled-components";

import { Helmet } from "react-helmet";
import { view } from "react-easy-state";
import removeMd from "remove-markdown";
import PostStore from "../../stores/Post";

import steemApi from "../../helpers/steemApi";
import getDateString from "../../utils/getDateString";
import renderToHTML from "./renderToHTML";
import Loader from "../../components/Loader";

import ActionWrapper from "./ActionWrapper";

import sentenceCase from "sentence-case";

import root from "window-or-global";

import Prism from "prismjs";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-ruby";
import "prismjs/components/prism-go";
import "prismjs/components/prism-php";

import detectLang from "../../utils/detectLang";
import getDollars from "../../utils/getDollars";
import typograph from "../../utils/typograph";

var loadLanguages = require("prismjs/components/index.js");
loadLanguages(["c", "cpp", "python", "java", "ruby", "go", "php"]);

const Header = styled.div`
  display: flex;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  z-index: 9;
  background: #fff;
`;
const User = styled.div`
  display: flex;
  align-items: center;
`;
const Ava = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  object-fit: cover;
  margin-right: 10px;
`;
const Earning = styled.div`
  font-style: italic;
  font-size: 14px;
  opacity: 0.7;
`;
const Username = styled.div`
  a {
    font-size: 14px;
    font-weight: bold;
    opacity: 0.9;
  }
`;
const Category = styled.div`
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: solid 1px #ddd;
`;
const Button = styled.button`
  margin: 3px;
  font-size: 12px;
  padding: 3px 8px;
  color: #333;
  border: solid 1px #ddd;
  background: #f6f6f6;
  font-weight: bold;
`;
const Time = styled.div`
  margin-right: 10px;
  font-size: 12px;
  font-style: italic;
`;
const Right = styled.div`
  display: flex;
  align-items: center;
`;
const TagWrapper = styled.div`
  padding: 10px;
  padding-bottom: 30px;
  padding-top: 20px;
  border-top: solid 1px #ddd;
`;
const Tag = styled.button`
  padding: 5px 10px;
`;
const Footer = styled.div``;

class Article extends Component {
  state = {
    // value: ""
    showActions: true,
    codeHasBeenRendered: false
  };
  componentDidMount() {
    const { author, permlink } = this.props.params;

    PostStore.getContent({ author, permlink });
    let prevScrollY = 0;
    window.addEventListener("scroll", e => {
      const { scrollY } = window;
      if (prevScrollY >= scrollY || scrollY <= 60) {
        this.setState({ showActions: true });
      } else {
        this.setState({ showActions: false });
      }
      prevScrollY = scrollY;
    });
  }

  highlightCode() {
    setTimeout(() => {
      const pres = Array.from(root.document.querySelectorAll("pre code")).map(
        code => {
          const text = code.innerText;
          let lang = detectLang(text).toLowerCase();
          if (lang === "unknown") {
            lang = "";
          }
          if (lang === "c++") {
            lang = "cpp";
          }
          const html = Prism.highlight(text, Prism.languages[lang], lang);
          code.innerHTML = html;
        }
      );
      this.setState({ codeHasBeenRendered: true });
    }, 50);
  }

  render() {
    const { author, permlink } = this.props.params;
    const id = `${author}/${permlink}`;
    const post = PostStore.selectPostById(id);
    const loading = PostStore.selectLoading({ author, permlink });

    if (!post.id) {
      if (post.id === 0) {
        return (
          <center>
            <h2>Article not found</h2>
          </center>
        );
      }
      return <Loader />;
    }
    // immutable
    let { image, links, users, tags } = post.json_metadata;
    const data = {
      body: post.body,
      json_metadata: {
        links: links ? [...links] : [],
        users: users ? [...users] : [],
        image: image ? [...image] : []
      },
      imageSizes: post.imageSizes ? [...post.imageSizes] : []
    };
    const description = removeMd(post.body).slice(0, 150);

    if (data.body.length > 2 && !this.state.codeHasBeenRendered) {
      this.highlightCode();
    }

    return (
      <div>
        <Helmet>
          <title>{post.title}</title>
          <meta name="description" content={description} />
          <meta property="og:title" content={post.title} />
          <meta property="og:type" content="article" />
          <meta
            property="og:url"
            content={`https://framesia.com/@${post.author}/${post.permlink}`}
          />
          <meta name="og:description" content={description} />
          <meta property="og:site_name" content="Framesia" />
          <meta property="og:image" content={image ? image[0] : null} />
        </Helmet>
        <Header>
          <User>
            <Link to={`/@${post.author}`}>
              <Ava
                src={`https://steemitimages.com/u/${post.author}/avatar/small`}
                onLoad={e => e.target.classList.add("loaded")}
              />
            </Link>
            <Username>
              <Link to={`/@${post.author}`}>{post.author}</Link>
              <Earning>${getDollars(post)}</Earning>
            </Username>
          </User>

          <Right>
            <Time>{getDateString(post.created)}</Time>
            <Link to={`/tag/${post.category}`}>
              <Category>{post.category}</Category>
            </Link>
          </Right>
        </Header>
        <div>
          <h1 className="title">{typograph(post.title)}</h1>
          {loading ? (
            <Loader />
          ) : (
            <React.Fragment>
              <div className="article">
                <div dangerouslySetInnerHTML={{ __html: renderToHTML(data) }} />
              </div>
              <ActionWrapper data={post} show={this.state.showActions} />
            </React.Fragment>
          )}
        </div>
        <TagWrapper>
          {tags.map(tag => (
            <Link to={`/tag/${tag}/hot`} key={tag}>
              <Tag>{sentenceCase(tag)}</Tag>
            </Link>
          ))}
        </TagWrapper>
        <Footer />
      </div>
    );
  }
}

export default view(Article);
