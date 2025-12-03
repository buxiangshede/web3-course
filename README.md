# Web3 Course Frontend & Contracts

基于 React + Wagmi + Hardhat 的 Web3 课程平台，涵盖推荐课程、创建课程、质押理财与个人中心等模块，同时提供多条合约与 Hardhat 开发环境，便于本地调试与部署到测试网（Sepolia）。

## 目录结构

```
web3-course/
├── frontend/                # React 前端 + Hardhat 工作区
│   ├── contracts/           # Solidity 合约（平台代币、课程、质押、个人档案）
│   ├── scripts/             # Hardhat 部署脚本
│   ├── src/                 # 前端业务代码（pages、components、providers 等）
│   ├── hardhat.config.js    # Hardhat 网络 & 编译配置
│   └── package.json         # 前端 + Hardhat 依赖与脚本
└── README.md                # 项目说明（本文件）
```

## 环境准备

1. **Node.js**：建议 v18+（Hardhat 对 Node 16 支持有限，会提示 warning）。
2. **依赖安装**：
   ```bash
   cd web3-course/frontend
   npm install
   ```

## 环境变量

在 `web3-course/frontend/.env` 中配置以下变量（已有示例）：

```ini
WALLETCONNECT_PROJECT_ID=...
GRAPH_API_URL=...
YD_TOKEN_ADDRESS=0x...
COURSE_MANAGER_ADDRESS=0x...
STAKING_CONTRACT_ADDRESS=0x...
PROFILE_REGISTRY_ADDRESS=0x...
SEPOLIA_RPC_URL=https://...
SEPOLIA_PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

> 若仅本地开发，可在部署脚本输出合约地址后，将地址填入 `*_ADDRESS` 字段。

## 常用脚本

| 命令 | 说明 |
| ---- | ---- |
| `npm run dev` | 启动前端（Webpack Dev Server），默认地址 `http://localhost:5173` |
| `npm run build` | 构建生产包 |
| `npm run hardhat` | Hardhat CLI |
| `npm run test:contracts` | 运行合约测试（需要自写 test/） |
| `npm run deploy:local` | 将合约部署到本地 Hardhat 网络（`npx hardhat node`） |
| `npm run deploy:sepolia` | 将合约部署到 Sepolia 测试网（需配置 RPC/私钥） |

## 合约说明

| 合约 | 功能 |
| ---- | ---- |
| `YDPlatformToken.sol` | 平台代币，可用 ETH 购买、支持销毁、所有者可调整单价/铸造，最大供应 10,000 个 |
| `CourseManager.sol` | 课程管理：创建/更新课程、记录购买、转账给课程作者 |
| `StakingTreasury.sol` | 简化版质押库：支持 ETH / YD 存取（示例逻辑，用于前端调试） |
| `ProfileRegistry.sol` | 存储用户的链上昵称（配合个人中心签名、更新流程） |

部署完成后，部署脚本会在终端输出每个合约地址。

## 前端与 Hardhat 联动

- RainbowKit 配置了 `hardhat` 网络（chainId: 31337），本地运行 `npx hardhat node` 后即可在前端连接并调试。
- `CreateCourse`、`Staking`、`Profile` 页面已通过 wagmi 接入对应合约，输入正确的合约地址即可直接调用。

## 调试流程示例

1. 启动本地链：`npx hardhat node`
2. 部署合约：`npm run deploy:local`，记录输出的合约地址
3. 更新 `.env` 中的 `*_ADDRESS`
4. 启动前端：`npm run dev`
5. 在浏览器使用 MetaMask 切换到 Hardhat 网络（导入私钥或使用 Hardhat 提供的账户），即可在页面直接调试合约交互。

## 前端模块与合约调用关系

为了方便调试与学习，下面列出各主要页面、组件与合约交互的对照表，说明每个操作触发了哪些函数：

### 推荐课程（`src/pages/RecommendedCourses.tsx`）
- **读取课程**：使用 `CourseManager.courses / nextCourseId / hasPurchased` 直接从链上获取课程列表与购买状态。
- **购买课程**：点击课程卡片的“购买课程”按钮会调用 `CourseManager.purchaseCourse`（payable，附带课程价格的 ETH），成功后触发 Toast 并刷新个人中心余额。

### 创建课程（`src/pages/CreateCourse.tsx`）
- **创建/提交**：表单提交后调用 `CourseManager.createCourse` 写入课程元数据。
- **奖励代币**：若配置了 `YD_TOKEN_ADDRESS`，创建成功会额外调用 `YDPlatformToken.mint` 给创作者奖励 100 YD。

### 质押理财（`src/pages/Staking.tsx`）
- **质押 ETH**：提交表单时调用 `StakingTreasury.depositEth`。
- **质押 YD**：先调用 `YDPlatformToken.approve` 授权质押合约，再执行 `StakingTreasury.depositYd`。
- **仓位展示**：通过 `StakingTreasury.positions` 读取当前地址的 ETH / YD 质押量和收益估算。

### 个人中心（`src/pages/Profile.tsx`）
- **钱包信息**：`useBalance` + `balanceRegistry.balanceOf` 显示原生资产与平台 YD 账本余额。
- **购买 YD 代币**：调用 `YDPlatformToken.buyTokens`（payable），用于购买平台专用代币。
- **修改昵称**：先通过 `YDPlatformToken.buyTokens` 支付改名费用，再调用 `ProfileRegistry.setProfile` 写入新的链上昵称。
- **课程列表**：复用 `useCourseManager` 的读取结果展示已购课程。

### 组件
- **WalletButton / NavBar**：使用 wagmi `useConnect/useDisconnect/useBalance` 管理钱包连接，不直接触发合约，但会在成功购买/创建后响应事件刷新显示。

您可以以此为参考扩展文档或编写测试用例，确保每个页面在调用链上接口时具备清晰的职责划分。

## 部署到 Sepolia 测试网

若需把所有合约部署到 Sepolia 并与前端联调，可按如下步骤操作：

1. **准备环境变量**
   - 在 `frontend/.env` 中填写以下字段：
     ```ini
     SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
     SEPOLIA_PRIVATE_KEY=0xyour_private_key       # 对应钱包需有 Sepolia ETH
     ETHERSCAN_API_KEY=your_etherscan_key         # 可选，用于验证合约
     ```
   - 如使用 Alchemy 或其他 RPC 服务，将 `SEPOLIA_RPC_URL` 替换为对应地址。

2. **编译与部署**
   ```bash
   cd web3-course/frontend
   npx hardhat compile
   npm run deploy:sepolia
   ```
   部署脚本会依次部署：
   - `YDBalanceRegistry`
   - `YDPlatformToken`
   - `CourseManager`
   - `StakingTreasury`
   - `ProfileRegistry`
   并在终端打印每个合约地址，请保留这些地址。

3. **配置前端 `.env`**
   - 将部署输出的地址分别填入：
     ```ini
     YD_TOKEN_ADDRESS=0x...
     COURSE_MANAGER_ADDRESS=0x...
     STAKING_CONTRACT_ADDRESS=0x...
     PROFILE_REGISTRY_ADDRESS=0x...
     BALANCE_REGISTRY_ADDRESS=0x...
     ```
   - 保存文件后重启前端 `npm run dev`，Webpack 会重新注入这些环境变量。

4. **连接 Sepolia 钱包**
   - 在浏览器中打开 `http://localhost:5173`。
   - 使用 MetaMask/WalletConnect 切换到 `Sepolia` 网络，并导入与 `SEPOLIA_PRIVATE_KEY` 对应的钱包或拥有测试币的地址。
   - 前端的 wagmi 默认允许连接 `mainnet/sepolia/hardhat`，若提示“Wrong Network”，点击钱包按钮切换到 Sepolia 即可。

5. **联调验证**
   - 在“创建课程”页提交表单，看是否成功生成交易并在 Etherscan 上可查。
   - 在“质押理财”页尝试质押 ETH（或 YD），观察交易记录与页面提示。
   - 在“个人中心”购买 YD、修改昵称，检查 `balanceRegistry.balanceOf` 返回的余额是否与交易一致。
   - 若遇到合约调用失败，确认钱包内有足够的 Sepolia ETH 并再次核对 `.env` 中的合约地址。

通过以上步骤，即可完成 Sepolia 部署与前端联调，实际体验与主网环境一致。若需要验证合约，可在部署后运行 `npx hardhat verify --network sepolia <contractAddress> ...`。

## 常见问题

- **Node 版本警告**：Hardhat 推荐使用 Node 18+，在 Node 16 下会出现 warning，但多数功能仍可运行。
- **合约调用失败**：确认 `.env` 中地址已更新并重新启动前端，或查看浏览器控制台获取 wagmi 具体报错。
- **构建产物过大警告**：由于引入钱包 SDK，Webpack 会提示 bundle size 偏大，可配合动态导入/拆分进一步优化。

如需进一步的集成说明或测试案例，可在 `frontend` 目录下补充 README / test 文件。欢迎根据业务需求扩展合约与前端交互逻辑。
