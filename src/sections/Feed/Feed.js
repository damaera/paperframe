import React, { Component } from "react";
import styled from "styled-components";

import sentenceCase from "sentence-case";

import { view } from "react-easy-state";
import { StickyContainer, Sticky } from "react-sticky";
import { Link } from "react-router-dom";

import PostStore from "../../stores/Post";
import AuthStore from "../../stores/Auth";
import TagStore from "../../stores/Tags";

import Card from "../../components/Card";
import Button from "../../components/Button";
import FeedLoading from "./FeedLoading";

const Wrapper = styled.div`
  margin-bottom: 40px;
`;
const Container = styled.div`
  width: 600px;
  margin: 0 auto;
  @media only screen and (max-width: 640px) {
    width: 100%;
  }
`;
const Content = styled.div`
  padding: 0 20px;
  border: solid 1px #eee;
  border-top: none;
  width: 100%;
`;
const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: solid 1px #eee;
  background: #eae6ff;
  z-index: 5;
`;
const Heading = styled.h3`
  font-family: "Josefin Slab", serif;
  padding: 20px;
  margin: 0;
  font-weight: bold;
  /* flex: 1; */
`;
const SortBy = styled.div``;

class Feed extends Component {
  state = {
    haveFetched: false,
    data: [],
    followText: "Followed ✓" // heading
  };

  componentDidMount() {
    if (!AuthStore.loading) {
      this.fetchPost(this.props.tag);
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.isLogin === false && nextProps.isLogin) {
      this.fetchPost(nextProps.tag);
    } else if (this.props.tag !== nextProps.tag) {
      this.fetchPost(nextProps.tag);
    }
  }

  onClickFollow = () => {
    TagStore.followTag(this.props.tag);
  };
  onClickUnfollow = () => {
    TagStore.unfollowTag(this.props.tag);
  };

  fetchPost = tag => {
    PostStore.getPosts({
      sortBy: "trending",
      query: {
        tag,
        limit: 5,
        truncate_body: 1
      }
    });
  };

  render() {
    const posts = PostStore.selectPosts({
      sortBy: "trending",
      tag: this.props.tag
    });
    const loading = PostStore.selectLoading({
      sortBy: "trending",
      tag: this.props.tag
    });

    let isFollowed = false;
    TagStore.selectFollowedTags().forEach(tag => {
      if (this.props.tag === tag) {
        isFollowed = true;
      }
    });

    const followLoading = TagStore.selectLoading(this.props.tag);

    return (
      <Wrapper>
        <Container>
          <StickyContainer>
            <Sticky topOffset={-50} bottomOffset={-100}>
              {({ style }) => {
                // console.log(style);
                return (
                  <Header style={{ ...style, top: 50 }}>
                    <Link to={`/tag/${this.props.tag}`}>
                      <Heading>{sentenceCase(this.props.tag)}</Heading>
                    </Link>
                    {AuthStore.me.name &&
                      (!isFollowed ? (
                        <Button
                          type="white"
                          style={{ margin: 0, marginRight: 20 }}
                          onClick={this.onClickFollow}
                          disabled={followLoading}
                        >
                          {followLoading ? "Loading..." : "Follow"}
                        </Button>
                      ) : (
                        <Button
                          type="yellow"
                          style={{ margin: 0, marginRight: 20 }}
                          onClick={this.onClickUnfollow}
                          disabled={followLoading}
                          onMouseEnter={e =>
                            this.setState({ followText: "Unfollow" })
                          }
                          onMouseLeave={e =>
                            this.setState({ followText: "Followed ✓" })
                          }
                        >
                          {followLoading ? "Loading..." : this.state.followText}
                        </Button>
                      ))}
                  </Header>
                );
              }}
            </Sticky>
            <Content>
              {loading && (
                <React.Fragment>
                  {[0, 1, 2].map(i => {
                    return <FeedLoading key={i} />;
                  })}
                </React.Fragment>
              )}
              {!loading &&
                posts.map(item => {
                  if (!item) {
                    return null;
                  }
                  return <Card data={item} key={item.id} />;
                })}
            </Content>
          </StickyContainer>
        </Container>
      </Wrapper>
    );
  }
}

export default view(Feed);
