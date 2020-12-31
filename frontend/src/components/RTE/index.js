import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import Title from './Title';
import ButtonBar from './ButtonBar';
import BodyBox from './BodyBox';
import Preview from './Preview';
import debouncer from '../../utils/debouncer';
import { CreatePost } from '../../store/post';

const newDebouncer = debouncer();

export default function RTE () {
  const dispatch = useDispatch();

  const [title, updateTitle] = useState('');
  const [RTEtext, updateRTEtext] = useState('');
  const [previewContents, updatePreviewContents] = useState('');

  const postSubmit = () => {
    dispatch(CreatePost({ title, postBody: previewContents }));
  };

  useEffect(() => {
    newDebouncer(RTEtext, updatePreviewContents);
  }, [RTEtext]);

  return (
    <div className='RTE textEditor'>
      <div className='writeContainer container editbox'>
        <Title title={title} updateTitle={updateTitle} />
        <ButtonBar updateRTEtext={updateRTEtext} />
        <BodyBox
          RTEtext={RTEtext}
          updateRTEtext={updateRTEtext}
          updatePreviewContents={updatePreviewContents}
        />
      </div>
      <div className='lamb'>
        <hr />
        Preview:
      </div>
      <Preview contents={previewContents} />
      <button
        className='submit createPost'
        onClick={postSubmit}
      >Post
      </button>
    </div>
  );
}
