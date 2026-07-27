# 固收业务展业研究汇报｜网页复刻

本项目将 22 页 PPT 材料复刻为固定 `1672 × 941` 的网页画布。

## 页面入口

- `/`：22 页总览
- `/slides/01` 至 `/slides/22`：纯净展示页，不包含翻页或编辑控件
- `/edit/01` 至 `/edit/22`：编辑页，可直接修改文字并保存

编辑结果保存在当前浏览器的 `localStorage` 中；保存后刷新对应展示页即可看到修改结果。

## 本地运行

```bash
cd site
npm install
npm run extract:deck
npm run dev -- --host 127.0.0.1
```

## 校验与构建

```bash
cd site
npm run check:deck
npm run build
npm run test:sites
```

## 实现说明

- 默认视觉由逐页蓝图确保高保真。
- PPTX 中的文字框已提取为可编辑数据层。
- 修改过的文字会以覆盖层显示在原蓝图对应位置。
- 图表、表格线框和装饰图形作为蓝图视觉保留；其数值文字可通过编辑层调整。

