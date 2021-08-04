#!/usr/bin/env node
//使用node开发命令行工具所执行JavaScript脚本必须在顶部加入 #!/usr/bin/env node 声明该命令行脚本是node.js写的

const program = require('commander') // 用以命令行描述
const download = require('download-git-repo'); // clone 项目
const iq = require('inquirer');       // 命令行答询
const hb = require('handlebars');       // 修改package.json文件
const ora = require('ora');         // 命令行中加载状态标识
const chalk = require('chalk');     // 命令行输出字符颜色
const ls = require('log-symbols');      // 命令行输出符号
const fs = require('fs'); // node fs原生模块
const downloadUrl = 'https://github.com:loufangjin-cpu/my-vue3-tmp#master'
const log = (content) => console.log(chalk.green(content))

const spawn = async (...args) => {
  const { spawn } = require('child_process')
  const options = args[args.length - 1]
  if (process.platform === 'win32') {
    // 设置 shell 选项为 true 以隐式地调用 cmd
    options.shell = true
  } else {
    // nothing
  }

  return new Promise((resolve) => {
    const proc = spawn(...args)
    proc.stdout.pipe(process.stdout) // 子进程正常流搭到主进程的正常流
    proc.stderr.pipe(process.stderr) // 子进程错误流插到主进程的错误流
    proc.on('close', () => {
      resolve()
    })
  })
}

program
  .command('init <projectName>') // 初始化参数
  .description('初始化项目')
  .action((projectName) => {
    // command命令后尖括号中指向了action中的参数
    // console.log('temp', projectName)
    const loading = ora('模板下载中...').start()
    // 第一个参数是github仓库地址，第二个参数是创建的项目目录名，第三个参数是clone
    download(downloadUrl, projectName, { clone: true }, (err) => {
      if (err) {
        loading.fail('模板下载失败')
      } else {
        loading.succeed('模板下载成功')
        // 命令行答询
        iq.prompt([
          {
            type: 'input', // 类型 输入框
            name: 'projectName', // 字段 key
            message: '请输入项目名称', // 描述
            default: projectName // 默认值
          },
          {
            type: 'input', // 类型 输入框
            name: 'projectVersion', // 字段 key
            message: '项目版本号', // 描述
            default: '0.0.1'
          },
          {
            type: 'input',
            name: 'description',
            message: '请输入项目简介',
            default: ''
          },
          {
            type: 'input',
            name: 'author',
            message: '请输入作者名称',
            default: 'loufangjin'
          }
        ]).then(async (answers) => {
          // answers 是一个对象，对象的 key 为上面答询的 name 的值，value 为 用户输入的值，如果未输入，就取默认值
          // 根据命令行答询结果修改 package.json 文件
          let packageContent = fs.readFileSync(
            `${projectName}/package.json`,
            'utf8'
          ) // 同步方式以 utf-8 字符集获得下载好的项目目录下的 package.json 文件
          let packageResult = hb.compile(packageContent)(answers) // 将用户输入项与原内容混合获得新内容
          fs.writeFileSync(`${projectName}/package.json`, packageResult) // 重新同步方式写入到 package.json 文件中
          // 用chalk和log-symbols改变命令行输出样式
          console.log(ls.success, chalk.green('模板项目文件准备成功！'))
          log('安装依赖')
          await spawn('npm', ['install'], { cwd: `./${projectName}` })
          log(`
                👌安装完成：
                To get Start:
                ===========================
                    cd ${projectName}
                    npm run serve
                ===========================
                            `)
          // const open = require('open')
          // open('http://localhost:8080')
          await spawn('npm', ['run', 'serve'], { cwd: `./${projectName}` })
        })
      }
    })
  })


program
    .command('list')
    .description('查看所有可用模板')
    .action(() => {
    })
program.version(require('../package').version)  // -V|--version时输出版本号
program.parse(process.argv) // 使用process.argv获取命令行参数,如果不添加 执行lfj -V 控制台不会输出参数
