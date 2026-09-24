# React Native 源码与原理问题整理（牛客）

检索时间：2026-09-23。范围：牛客公开可见的面经与技术文章，聚焦 React Native（RN）的运行原理、架构、JS/Native 通信、渲染、打包和性能。问题按主题去重、统一措辞；“面经问题”包括原帖明确列出的问题和考察主题，其中主题已改写为问题；“文章延伸题”根据牛客技术文章整理，不代表原帖记录了面试提问。各题链接指向对应原帖。部分旧帖讨论的是经典 Bridge 架构，复习时应标明适用的 RN 版本，不能直接当作新架构结论。

## 一、架构与跨端原理（面经问题）

1. React Native 的底层原理是什么？从 JS 代码到原生界面，大致经过哪些层？[牛客面经](https://www.nowcoder.com/discuss/353156304837484544)
2. RN 如何实现跨平台开发？平台共用的部分和分别由 iOS、Android 实现的部分是什么？[牛客面经](https://www.nowcoder.com/discuss/353156304837484544)
3. RN 底层架构中，JS 层、C++ 层和原生层各承担什么职责？[牛客面经](https://www.nowcoder.com/discuss/353156455610130432)
4. RN 与原生开发的主要区别是什么？什么场景选择原生实现，什么场景选择 RN？[牛客面经一](https://www.nowcoder.com/discuss/923168327453642752)、[牛客面经二](https://www.nowcoder.com/feed/main/detail/ed37a872568b49a38aa6d92be4891c5a)
5. RN 与小程序在运行和渲染架构上有什么区别？[牛客面经](https://www.nowcoder.com/discuss/923168327453642752)
6. RN 与 WebView 混合开发的渲染方式有什么区别？一个 App 页面在两种方案之间如何选型？[牛客面经一](https://www.nowcoder.com/discuss/923168327453642752)、[牛客面经二](https://www.nowcoder.com/discuss/433397518039269376)
7. 从渲染引擎和跨端实现方式看，RN、Flutter 和 Weex 有什么区别？[牛客面经一](https://www.nowcoder.com/discuss/612342189397409792)、[牛客面经二](https://www.nowcoder.com/discuss/353156455610130432)
8. RN 的主要优缺点是什么？相较 Flutter，性能差异可能来自哪些环节？[牛客面经一](https://www.nowcoder.com/discuss/353154905290514432)、[牛客面经二](https://www.nowcoder.com/discuss/478991052657963008)

## 二、JS 与 Native 通信（面经问题）

9. RN 中 JS 和 Native 如何互相调用？从 JS 发起一次 Android 原生方法调用，需要经过哪些步骤？[牛客面经一](https://www.nowcoder.com/feed/main/detail/646ebb6228fb4f1da0f711dd4ff63bc3)、[牛客面经二](https://www.nowcoder.com/discuss/353154028328656896)
10. 经典 RN Bridge 的工作原理是什么？JSBridge 在其中具体做了什么？[牛客面经一](https://www.nowcoder.com/feed/main/detail/646ebb6228fb4f1da0f711dd4ff63bc3)、[牛客面经二](https://www.nowcoder.com/discuss/725715986279571456)
11. JS 是单线程的，怎样与 Native 的多线程执行模型交互？[牛客面经](https://www.nowcoder.com/discuss/353148405239193600)
12. 经典架构中，JS 与 Native 通信传递的数据结构是什么？数据怎样跨语言传递？[牛客面经](https://www.nowcoder.com/discuss/353148405239193600)
13. RN 如何使用 WebView 组件？RN 页面与原生层有哪些交互方式？[牛客面经](https://www.nowcoder.com/discuss/353156304837484544)
14. RN 应用中的 JS 错误如何监听和上报？与 H5 全局异常采集有什么区别？[牛客面经](https://www.nowcoder.com/feed/main/detail/ed37a872568b49a38aa6d92be4891c5a)

## 三、渲染、列表与性能（面经问题）

15. RN 的 JS 层如何驱动原生组件渲染？它和 Web 的 DOM 渲染有什么区别？[牛客面经一](https://www.nowcoder.com/discuss/353156455610130432)、[牛客面经二](https://www.nowcoder.com/discuss/353148405239193600)
16. RN 中的 `FlatList` 是什么？列表项高度不一致时，虚拟列表如何估算和维护可见范围？[牛客面经](https://www.nowcoder.com/discuss/921786525879128064)
17. RN 容器的启动和页面渲染性能如何优化？哪些环节适合监控？[牛客面试题帖](https://www.nowcoder.com/discuss/782285130642530304)
18. RN 页面启动后白屏，如何按 Bundle 加载、JS 执行、布局、原生渲染和异常逐步排查？[牛客面经](https://www.nowcoder.com/discuss/353156455610130432)

## 四、构建、拆包与动态更新（面经问题）

19. React Native 代码的编译和打包流程是什么？JS 代码如何成为 App 可加载的 Bundle？[牛客面经](https://www.nowcoder.com/feed/main/detail/ed37a872568b49a38aa6d92be4891c5a)
20. RN 热更新的基本原理是什么？开源社区通常怎样实现 Bundle 的下载与切换？[牛客面经](https://www.nowcoder.com/feed/main/detail/ed37a872568b49a38aa6d92be4891c5a)
21. RN 为什么要拆包？基础包与业务包分别放哪些模块？[牛客面经](https://www.nowcoder.com/discuss/353148405239193600)

## 五、源码阅读延伸（牛客技术文章，非面经原题）

22. `FlatList`、`VirtualizedList` 和 `ScrollView` 是什么关系？`FlatList` 为什么比直接用 `ScrollView` 更适合长列表？[牛客技术文章](https://www.nowcoder.com/discuss/514093207819509760)
23. `FlatList` 如何计算渲染窗口、卸载窗口外内容？滚动很快时为何仍可能出现空白区域？[牛客技术文章](https://www.nowcoder.com/discuss/514093207819509760)
24. `getItemLayout` 能省去哪些运行时测量？列表项高度不固定时应如何权衡测量与预估？[牛客技术文章](https://www.nowcoder.com/discuss/514093207819509760)
25. Metro 的 `createModuleIdFactory` 与 `processModuleFilter` 分别在 RN 拆包中起什么作用？模块 ID 为什么必须稳定？[牛客技术文章](https://www.nowcoder.com/discuss/512786881076015104)
26. 基础包和业务包如何避免重复打入依赖？原生容器应按什么顺序加载这些 Bundle？[牛客技术文章](https://www.nowcoder.com/discuss/512786881076015104)
27. 拆包和差分更新分别能减少哪些启动、内存和发布成本？它们会增加哪些包版本与依赖管理问题？[牛客技术文章](https://www.nowcoder.com/discuss/512786881076015104)
28. RN 页面卡顿时，怎样区分 JS 线程掉帧和 UI 线程掉帧？[牛客技术文章](https://www.nowcoder.com/discuss/514093207819509760)

> 检索说明：本次牛客公开结果以经典 Bridge、原生通信和工程实践为主；没有把其他网站的 JSI、Fabric、TurboModules 题目冒充成牛客来源。
