/** @jsx h */
import 'regenerator-runtime/runtime'
import { ref } from '../../packages/reactivity'
import { Fragment, h, Suspense, defineAsyncComponent, defineComponent } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const ProfileDetails = defineAsyncComponent({
  loader: () => import('./async.jsx'),
  loadingComponent: defineComponent(() => () => <h1>Loading...</h1>),
  suspensible: false,
});

const App = {
  setup(props) {
    return () => (
      <Suspense fallback={<h1>Loading by Suspense</h1>}>
        <ProfileDetails />
      </Suspense>
    );
  },
};

createApp(App).mount('#root')
