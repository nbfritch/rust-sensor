/* @refresh reload */
import { render } from 'solid-js/web'
import './index.css'
import App from './App.tsx'
import 'bulma/css/bulma.css';
import { Router, Route } from '@solidjs/router';
import { Nav } from './components/Nav.tsx';
import { Current } from './components/Current.tsx';

const root = document.getElementById('app')

render(() =>
  <>
    <Nav />
    <Router>
      <Route path="/" component={Current} />
    </Router>
  </>, root!)
