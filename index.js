const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 风格与小饰品提示词映射
const styleTipsMap = {
    "极简风": "以白、浅灰为主，线条利落；小饰品：白色陶瓷收纳盒、原木挂钩、几何金属摆件、透明玻璃花瓶（插单支尤加利）。",
    "日系风": "原木+米白，温暖柔和；小饰品：棉麻收纳筐、木质置物架、日式纸灯、干花束、棉麻桌旗。",
    "ins风": "低饱和莫兰迪色，治愈温柔；小饰品：编织篮、奶油色陶瓷花瓶、ins风贴纸、金属网格架、香薰蜡烛。",
    "奶油风": "奶白+浅杏，软糯温馨；小饰品：奶fufu收纳罐、毛绒地毯、蝴蝶结挂钩、奶油色台灯、小雏菊干花。",
    "温馨风": "温暖柔和，家的感觉；小饰品：温暖台灯、柔软抱枕、装饰画框、绿植盆栽、香薰蜡烛、编织收纳篮、毛绒地毯、家庭照片墙。",
    "电竞风": "黑+灰+RGB灯效，科技感强；小饰品：RGB灯带、电竞鼠标垫、金属耳机挂架、电竞主题贴纸、LED氛围灯。",
    "冷风": "黑+深灰+金属质感，硬朗酷感；小饰品：金属挂钩、工业风壁灯、做旧木箱收纳、铁艺置物架、黑胶唱片装饰。",
    "工业风": "黑+深灰+金属质感，硬朗酷感；小饰品：金属挂钩、工业风壁灯、做旧木箱收纳、铁艺置物架、黑胶唱片装饰。",
    "原木风": "原木+暖白，自然质朴；小饰品：藤编收纳篮、木质书签架、多肉盆栽、棉麻窗帘绑带、原木杯垫。"
};

// 新手引导文案
const newbieGuide = `
🎉 欢迎使用「AI一键整洁收纳」技能！新手3分钟上手教程：

1. 📸 上传图片：发送你的出租屋照片（客厅/卧室整体视角最佳）
2. 📝 发送指令：比如「帮我整理房间，极简风」
3. ⏳ 等待生成：10秒左右即可得到整洁版效果图

💡 可选风格：极简风/日系风/ins风/奶油风/电竞风/工业风/原木风
❓ 有问题发送「常见问题」查看解答
`;

// 风格列表文案
const styleList = `
🎨 本技能支持的风格列表：

1. 极简风（推荐）：白+浅灰，线条利落，干净通透
2. 日系风：原木+米白，温暖柔和
3. ins风：莫兰迪色，治愈温柔
4. 奶油风：奶白+浅杏，软糯温馨
5. 电竞风：黑+灰+RGB，科技感拉满
6. 工业风/冷风：黑+深灰+金属，酷感十足
7. 原木风：原木+暖白，自然质朴

✅ 使用示例：帮我整理房间，电竞风
`;

// 常见问题文案
const faq = `
❓ 常见问题解答：

1. 生成的图片改变了我的家具？
→ 本技能默认保留所有大件家具/墙上挂件，若仍有问题，发送「保留所有家具 极简风」重试

2. 图片生成失败？
→ ① 检查图片是否清晰 ② 确保网络正常 ③ 换个风格试试

3. 想调整小饰品？
→ 发送「极简风 少放小饰品」或「电竞风 多加点RGB灯带」

4. 图片效果不满意？
→ 补充描述：比如「帮我整理房间，极简风 重点整理桌面」
`;

module.exports = async function (params) {
    try {
        // 1. 提取用户输入（指令+图片）
        const { text = "", image_path } = params;
        const lowerText = text.toLowerCase().trim();

        // 2. 新手引导/风格列表/常见问题 指令处理（无图片也能响应）
        if (lowerText.includes("新手教程") || lowerText.includes("怎么用") || lowerText.includes("上手")) {
            return {
                success: true,
                message: newbieGuide
            };
        }
        if (lowerText.includes("查看风格") || lowerText.includes("风格列表")) {
            return {
                success: true,
                message: styleList
            };
        }
        if (lowerText.includes("常见问题") || lowerText.includes("问题")) {
            return {
                success: true,
                message: faq
            };
        }

        // 3. 无图片时的引导
        if (!image_path) {
            return {
                success: false,
                message: `⚠️ 还没上传房间图片哦！

✅ 正确用法：
1. 先发送你的出租屋照片
2. 再发送指令（比如「帮我整理房间，极简风」）

💡 发送「新手教程」查看详细步骤`
            };
        }

        // 4. 校验图片
        if (!fs.existsSync(image_path)) {
            return {
                success: false,
                message: `⚠️ 图片上传失败！

✅ 解决方法：
1. 重新发送清晰的房间照片（避免模糊/黑屏）
2. 确保图片格式为JPG/PNG
3. 发送「新手教程」查看拍照技巧`
            };
        }

        // 5. 解析风格（默认极简风，兼容模糊指令）
        let style = "极简风";
        // 匹配用户指令中的风格
        Object.keys(styleTipsMap).forEach(key => {
            if (lowerText.includes(key.toLowerCase()) || lowerText.includes(key)) {
                style = key;
            }
        });
        // 兼容「冷风」=「工业风」
        if (lowerText.includes("冷风") && !lowerText.includes("工业风")) {
            style = "冷风";
        }

        // 6. 读取图片并转Base64（带MIME类型前缀，用于wan2.6-image）
        const imageBuffer = fs.readFileSync(image_path);
        const imageBase64 = imageBuffer.toString('base64');
        const mimeType = getMimeType(image_path);
        const imageDataUrl = `data:${mimeType};base64,${imageBase64}`;

        // 7. 解析用户额外要求（比如「少放小饰品」「保留所有家具」）
        let extraPrompt = "";
        if (lowerText.includes("少放小饰品") || lowerText.includes("少点装饰")) {
            extraPrompt += "小饰品仅少量点缀，以整洁为主；";
        }
        if (lowerText.includes("多放小饰品") || lowerText.includes("多点装饰")) {
            extraPrompt += "小饰品适当增加，提升风格氛围感；";
        }
        if (lowerText.includes("保留所有家具") || lowerText.includes("不移动家具")) {
            extraPrompt += "所有家具（包括小桌椅、墙上挂件）完全不移动、不删除；";
        }
        // 解析重点整理区域
        if (lowerText.includes("桌面") || lowerText.includes("桌子")) {
            extraPrompt += "重点整理桌面杂物，归置桌面物品；";
        }
        if (lowerText.includes("地面") || lowerText.includes("地板")) {
            extraPrompt += "重点清理地面杂物，归置地面物品；";
        }

        // 8. 完整提示词（主任提供的核心要求）
        const styleTips = styleTipsMap[style] || styleTipsMap["极简风"];
        const fixedPrompt = `核心要求：
1. 整洁优先：空间整洁，垃圾清理干净，包括床上、地上、墙上、茶几、沙发、柜子里的杂乱物品摆放整齐，可移动的家具摆放整齐；空间通透干净。
2. 家具保留：所有大件家具或者不可移动家具（沙发、茶几、衣柜、空调等）完全不移动、不删除、不替换；仅将可移动的椅子、轻易移动的家具摆放好。注意：窗帘后面是窗户，不能把窗帘、窗户当作墙壁！对于窗帘以及窗户，不能新建饰品阻挡。
3. 收纳与装饰：仅添加低成本收纳用品，并搭配指定风格的低成本小饰品（单价≤20元），小饰品适量点缀，默认在3-6个。
4. 风格适配：严格遵循指定风格，不得改变地板墙壁颜色，保持原图光影、透视、材质不变，不删去原有家具，追求真实。
5. 可以按照风格设计墙纸，墙上挂件；如果房子已经存在墙上挂件，不能更改，移动，删除；
6. 窗帘保持垂顺平整，无褶皱堆积，营造通透感；地上无垃圾，清扫干净，床上床单枕头以及被子衣物等杂物摆放有序，床单平整；
用户额外要求：${extraPrompt || "无额外要求"}

指定风格：${style}
风格细节与小饰品提示：${styleTips}`;

        console.log("正在调用通义万相API...");
        console.log("模型: wan2.6-image");
        console.log("风格:", style);

        // 9. 调用通义万相API - 使用测试成功的 wan2.6-image
        const response = await axios.post(
            "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation",
            {
                model: "wan2.6-image",
                input: {
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    text: fixedPrompt
                                },
                                {
                                    image: imageDataUrl
                                }
                            ]
                        }
                    ]
                },
                parameters: {
                    negative_prompt: "改变不可移动、难移动的家具位置、删除空间内原有物品、改变地板墙壁颜色、夸张变形、卡通插画、模糊、低画质、水印、虚化背景、把窗帘当作墙壁、把窗户当作墙壁",
                    prompt_extend: true,
                    watermark: false,
                    n: 1,
                    enable_interleave: false,
                    size: "1K"
                }
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.DASHSCOPE_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 120000
            }
        );

        console.log("API响应成功！");

        // 10. 返回结果（带使用引导）
        const resultImageUrl = response.data?.output?.choices?.[0]?.message?.content?.[0]?.image;
        if (!resultImageUrl) {
            return {
                success: false,
                message: `❌ 生成失败！

✅ 解决方法：
1. 检查网络是否正常
2. 重新上传清晰的房间照片
3. 换个风格试试（比如「帮我整理房间，极简风」）

💡 发送「常见问题」查看更多解决方案`
            };
        }

        // 根据风格生成小饰品清单
        let accessoryList = "";
        switch(style) {
            case "极简风":
                accessoryList = `🎁 添加的小饰品：白色陶瓷收纳盒、原木挂钩、几何金属摆件、透明玻璃花瓶`;
                break;
            case "日系风":
                accessoryList = `🎁 添加的小饰品：棉麻收纳筐、木质置物架、日式纸灯、干花束`;
                break;
            case "ins风":
                accessoryList = `🎁 添加的小饰品：编织篮、奶油色陶瓷花瓶、ins风贴纸、金属网格架`;
                break;
            case "奶油风":
                accessoryList = `🎁 添加的小饰品：奶fufu收纳罐、毛绒地毯、蝴蝶结挂钩、奶油色台灯`;
                break;
            case "温馨风":
                accessoryList = `🎁 添加的小饰品：温暖台灯、柔软抱枕、装饰画框、绿植盆栽`;
                break;
            case "电竞风":
                accessoryList = `🎁 添加的小饰品：RGB灯带、电竞鼠标垫、金属耳机挂架、LED氛围灯`;
                break;
            case "工业风":
            case "冷风":
                accessoryList = `🎁 添加的小饰品：金属挂钩、工业风壁灯、做旧木箱收纳、铁艺置物架`;
                break;
            case "原木风":
                accessoryList = `🎁 添加的小饰品：藤编收纳篮、木质书签架、多肉盆栽、原木杯垫`;
                break;
            default:
                accessoryList = `🎁 添加的小饰品：适量点缀${style}风格小饰品`;
        }

        return {
            success: true,
            image_url: resultImageUrl,
            message: `✅ ${style}整洁收纳完成！

📌 保留所有原有家具与墙面挂件
🧹 空间已整理干净，小桌椅已归位
${accessoryList}

💡 小提示：
1. 不满意可发送「${style} 少放小饰品」重新生成
2. 想换风格发送「帮我整理房间，电竞风」
3. 发送「新手教程」查看更多用法`
        };

    } catch (error) {
        console.error("Skill执行错误:", error);
        return {
            success: false,
            message: `❌ 系统繁忙！

✅ 快速解决：
1. 检查你的阿里云API密钥是否正确
2. 重新上传图片重试
3. 发送「常见问题」查看更多解决方案`
        };
    }
};

// 根据文件扩展名获取MIME类型
function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.bmp': 'image/bmp',
        '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
}
