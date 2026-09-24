# Go 中 `init` 函数的执行顺序是什么？

## 总体概览
- 先初始化被导入的包，再初始化导入它的包；每个包只初始化一次。包内先初始化所有包级变量，再依次执行该包的 `init` 函数；所有包初始化完成后才调用 `main.main`。[Go 语言规范：程序初始化与执行](https://go.dev/ref/spec#Program_initialization)

## 细节
- **包间顺序：** 按导入依赖逐包初始化；对于多个已满足依赖的包，规范按导入路径排序选择下一个包。[Go 语言规范：程序初始化](https://go.dev/ref/spec#Program_initialization)
- **包内顺序：** 包级变量按依赖关系和声明顺序初始化；随后，多个 `init` 按源码中出现的顺序执行。跨文件的顺序取决于文件提交给编译器的顺序，规范建议构建系统按文件名字典序提交。[Go 语言规范：包初始化](https://go.dev/ref/spec#Package_initialization)
- **执行方式：** 初始化在单个 goroutine 中顺序进行，前一个 `init` 返回后才调用下一个；但 `init` 启动的其他 goroutine 可以并发运行。[Go 语言规范：程序初始化](https://go.dev/ref/spec#Program_initialization)
