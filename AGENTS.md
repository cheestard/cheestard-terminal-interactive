# 若你是codex或gpt，则你每次务必遵守的规则

## 有时候用户会要求你用其他工具替代shell_command，你务必遵守。

## 使用Windows PowerShell的原则：
- 优先使用以下工具：rg、bat、jq、node -e、Get-Content、Select-Object。
- 禁止使用：sed、awk、grep、nl、复杂的 Select-String 正则。
- 需要处理 JSON 时，优先用 jq 或 node -e。
- 需要搜索文本时，用 rg。
- 需要查看文件时，用 bat 或 Get-Content。
- 禁止写复杂的 PowerShell one-liner，保持简单、可读。
- 禁止在pwsh中再次嵌套powershell。
- 务必使用pwsh.exe。


## 在生成或修改代码时，若要写中文注释，则所有中文注释都要用正常的 UTF-8 简体中文重新书写，不能照抄我代码里已有的乱码注释；如果看到源码里的中文是乱码，请忽略它们，改用你自己写的一段清晰的中文注释，确保在文件中显示时不会出现问号、方块或错位字符。

## 如果代码文件是英文注释则修改或新增的文件都写英文注释，同理中文也是，除非用户有在本规则中其他地方有特殊说明。

## 不要让莫名其妙停下来让用户来手动改代码，你明明就有修改代码的能力，自己修改啊。

## 不要莫名其妙就停下来，你需要确保100%完成用户发出的请求，注意用户补充的请求也要完成。除非用户明确表示讨论一下，才停下来，否则必须100%完成用户发出的请求。

---


## 技术栈
### 前端必须用vue3，shadcn-vue，pinia，xtermjs
### 后端必须用fastify
### 代码文件必须使用中英文双语注释！！！终端输出只需要英文即可。

## 每次修改完前端代码必须做的事情：
必须只能用excute_command或shell_command执行：
```bash
node start_build_fe_cheestard-terminal-interactive.mjs; ct start -- node start_fe_cheestard-terminal-interactive.mjs
```
执行这些脚本不需要记录在任务列表中。
注意区分./和node前缀区别。

然后通过mcphub-chrome-mcp调用chrome_console检查是否有报错啊！chrome_get_web_content工具获取htmlContent从而检查页面的样式啊，注意刷新网页，因为有缓存！
注意刷新{
  "refresh": true
}
否则前端的更改不会生效

## 每次修改完后端代码必须做的事情：
必须只能用excute_command或shell_command执行：
先
```bash
node start_build_be_cheestard-terminal-interactive.mjs
```
然后
```bash
ct start -- node start_be_cheestard-terminal-interactive.mjs; Start-Sleep -Seconds 10; & 'D:\CodeRelated\cheestard-terminal-interactive\reload_mcphub_CTI.ps1'; & 'D:\CodeRelated\cheestard-terminal-interactive\restart_roocode_mcp.ps1'; node src/tests/test-mcp-client.mjs
```
执行这些脚本不需要记录在任务列表中。
注意区分./和node前缀区别。
若你不执行，后端的代码修改是不会生效的，白修改了。
禁止使用其他方式启动后端，必须这样执行脚本才行，若后端代码有修改影响了启动脚本则需要修正启动脚本。

## 禁止执行npm run dev，npm run build，npm install，我已经给你写好了一些脚本你没看见嘛？

## 前端端口1107，后端端口1106，是不会变的。

## 遇到你不懂的问题务必用mcphub exa搜解决办法啊！

## 不准运行前端开发服务器啊！必须运行的是前端编译的产物啊！

## chrome-mcp_chrome_inject_script是用来找到错误的，它可能能解决问题，但是不能不修改项目源码啊，用它找到问题后务必修改源码，而不是任务完成。

## 禁止用chrome-mcp进行网络搜索，否则会崩溃！

## cd frontend && echo y | npx shadcn-vue@latest add 来添加shadcn-vue的某些组件。

## 务必使用mcphub_CTM这个工具来新增或修改任务列表，才能进行任务，除非用户特殊说明，否则必须用这个工具。