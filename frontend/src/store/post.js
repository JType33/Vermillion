import csrfetch from './csrf';

const CREATE = 'post/CREATE';
const ENUMERATE = 'post/ENUMERATE';

const renderPost = post => ({ type: CREATE, post });
const untoFollower = list => ({ type: ENUMERATE, list });

export const CreatePost = content => async dispatch => {
  const newPostResponse = await csrfetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ content })
  });
  if (newPostResponse.data) dispatch(renderPost(newPostResponse.data));
};

export const EnumerateFlowContainer = whereAmI => async dispatch => {
  const fetchUrl = whereAmI === '/' ? '/api/posts/me/following' : `/api/users/${whereAmI}/posts`;
  const followedPostsResponse = await csrfetch(fetchUrl);
  if (followedPostsResponse.data) dispatch(untoFollower(followedPostsResponse.data.posts));
};

export const UpdatePost = (postId, component, payload) => async () => {
  const updatePostResponse = await csrfetch(`/api/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify({ component, payload })
  });
  if (updatePostResponse.data?.success) return { postId, component, payload };
};

export const TouchPost = (postId, type) => async () => {
  const { data } = await csrfetch(`/api/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ type })
  });
  const { result } = data ?? { result: false };
  if (data && result) return result;
};

export default function postReducer (state = { list: null }, { type, list, post }) {
  console.log('State incoming:', state);
  switch (type) {
    case CREATE: return { ...state, list: [...(state.list ?? []), { ...post }] };
    case ENUMERATE: return state.list ? { ...state } : { ...state, list };
    default: return state;
  }
}
