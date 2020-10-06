/** @jsx h */
import 'regenerator-runtime/runtime'
import { ref } from '../../packages/reactivity'
import { Fragment, h, Suspense } from '../../packages/runtime-core'
import { createApp } from '../../packages/runtime-dom'

const get = (val, time) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(val);
    }, time);
  });

const ProfileDetails = {
  async setup(props) {
    const user = await get('user', 1000);
    return () => <h1>{user}</h1>;
  },
};

const ProfileTimeline = {
  async setup(props) {
    const posts = await get('posts', 2000);
    return () => <h2>{posts}</h2>;
  },
};

const App = {
  setup(props) {
    return () => (
      <Suspense fallback={<h1>Loading 1</h1>}>
        <Fragment>
          <ProfileDetails />
          <Suspense fallback={<h2>Loading 2</h2>}>
            <ProfileTimeline />
          </Suspense>
        </Fragment>
      </Suspense>
    );
  },
};

createApp(App).mount('#root')

// /** @jsx h */
// import 'regenerator-runtime/runtime'
// import { effect, reactive, ref } from '../../packages/reactivity'
// import { h, watchEffect, computed, Suspense, Fragment } from '../../packages/runtime-core'
// import { createApp } from '../../packages/runtime-dom'

// const get = (val, time = 3000) =>
//   new Promise((resolve) => {
//     setTimeout(() => {
//       resolve(val);
//     }, time);
//   });

// const Content = {
//   async setup(props) {
//     const content = await get(props.children)
//     return () => <li>{content}</li>
//   }
// }

// const Li = {
//   setup(props) {
//     return () => (
//       // <Suspense fallback={<li>Loading...</li>}>
//         <Content>{props.children}</Content>
//       // {/* </Suspense> */}
//     )
//   }
// }

// const App = {
//   setup(props) {
//     const list = reactive([1, 2, 3, 4, 5])
//     const shuffle = () => list.sort(() => Math.random() < 0.5 ? 1 : -1)
//     const swapTwo = () => {
//       const first = Math.floor(Math.random() * list.length)
//       const second = Math.floor(Math.random() * list.length)
//       ;[list[first], list[second]] = [list[second], list[first]]
//     }
//     const insert = () => {
//       const num = Math.floor(Math.random() * list.length)
//       list.splice(0, 0, Math.random() * list.length)
//       console.log(num)
//     }

//     return () => (
//       <div>
//         <ul>
//           {list.map(e => <div><Suspense fallback={<li>Loading...</li>}><Li key={e}>{e}</Li></Suspense></div>)}
//         </ul>
//         <button onClick={swapTwo}>swapTwo</button>
//         <button onClick={shuffle}>shuffle</button>
//         <button onClick={insert}>insert</button>
//       </div>
//     )
//   }
// }

// createApp(App).mount('#root')
