import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';

import { LogOut } from '../../store/session';

export default function ProfileButton () {
  const dispatch = useDispatch();
  const [popped, togglePopped] = useState(false);

  const user = useSelector(({ session: { user } }) => user);
  const toggle = () => togglePopped(popped => !popped);
  const unPop = () => {
    togglePopped(false);
  };

  const logout = () => {
    dispatch(LogOut());
  };

  useEffect(() => {
    if (popped) {
      setTimeout(() => {
        document.addEventListener('click', unPop);
      }, 100);
    }
    if (!popped) {
      document.removeEventListener('click', unPop);
    }
    return () => {
      document.removeEventListener('click', unPop);
    };
  }, [popped]);

  return (
    <>
      <div
        className='profileButtonHolder profile'
        style={{
          textAlign: 'right'
        }}
      >
        <div
          id='userMenu'
          onClick={toggle}
          style={{
            alignItems: 'center',
            justifyItems: 'left',
            height: popped ? '92px' : '30px',
            width: popped ? '115px' : '30px',
            marginLeft: 'auto',
            marginRight: '5px',
            borderRadius: '4px',
            gridTemplateRows: 'repeat(4, 1fr)',
            overflow: 'hidden'
          }}
        >
          <AccountCircleIcon id='navProfile' />
          <ButtonGroup
            orientation='vertical'
            variant='text'
            className={`${popped ? 'popped' : 'unpopped'}`}
            color='default'
          >
            <NavLink to='/' style={{ pointerEvents: popped ? 'unset' : 'none' }}>
              <Button
                className={`${popped ? 'popped' : 'unpopped'}`}
                disabled={!popped}
              >
                Home
              </Button>
            </NavLink>
            <NavLink to={`/${user.username}`} style={{ pointerEvents: popped ? 'unset' : 'none' }}>
              <Button
                className={`${popped ? 'popped' : 'unpopped'}`}
                disabled={!popped}
              >
                My Blog
              </Button>
            </NavLink>
            <Button
              className={`${popped ? 'popped' : 'unpopped'}`}
              disabled={!popped}
              onClick={logout}
            >
              Log Out
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </>
  );
}
