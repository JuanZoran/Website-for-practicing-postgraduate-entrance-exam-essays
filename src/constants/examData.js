/**
 * 考研英语作文题目数据
 * 包含历年真题和预测题
 */

export const EXAM_DATA = [
  {
    id: "2010", year: "2010", title: "文化火锅", mode: "Mode A", visualType: "image", description: "火锅里煮着佛像、莎士比亚、功夫等中西文化元素。",
    defaultImage: "/images/exam/2010.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述火锅中的中西元素融合。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：火锅里汇聚了莎士比亚和功夫..." },
      { id: "arg1", label: "核心意义", question: "文化融合为何重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：促进文明繁荣，取长补短..." },
      { id: "action", label: "建议", question: "如何对待外来文化？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：取其精华，去其糟粕..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon: a huge 'hotpot' containing various cultural elements. Specifically, {{desc}}. Simple as the picture is, the symbolic meaning behind it is strictly distinct.\n\nThe primary purpose is to illustrate the importance of cultural integration. Why does this matter? First and foremost, {{arg1}}. It is cultural exchange that enables civilizations to flourish.\n\nIn view of the arguments above, cultural diversity is of vital importance. Accordingly, it is imperative for us to {{action}}. Only in this way can we build a harmonious global village."
  },
  {
    id: "2011", year: "2011", title: "旅途之余", mode: "Mode B", visualType: "image", description: "游客在船上乱扔垃圾，破坏风景。",
    defaultImage: "/images/exam/2011.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述游客的不文明行为。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：游客一边欣赏风景，一边乱扔垃圾..." },
      { id: "harm", label: "危害分析", question: "这种行为有什么后果？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：破坏生态平衡，损害社会公德..." },
      { id: "action", label: "建议", question: "如何解决？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：提高环保意识，加强监管..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon showing tourists littering. Specifically, {{desc}}. Simple as the picture is, the symbolic meaning is strictly distinct.\n\nThe primary purpose is to illustrate the detrimental effect of immoral behavior. Why does this matter? First and foremost, {{harm}}. It is this lack of public spirit that threatens our environment.\n\nIn view of the arguments above, environmental protection is of vital importance. Accordingly, it is imperative for us to {{action}}. Only in this way can we leave a beautiful world for future generations."
  },
  {
    id: "2012", year: "2012", title: "打翻酒瓶", mode: "Mode A", visualType: "image", description: "瓶子倒了，一人叹息全完了，一人庆幸剩一半。",
    defaultImage: "/images/exam/2012.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "对比两人的反应。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一人悲观叹息，另一人乐观庆幸..." },
      { id: "arg1", label: "核心论点", question: "为什么乐观很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：乐观是面对逆境的精神支柱..." },
      { id: "action", label: "建议", question: "我们该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：停止抱怨，珍惜当下..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate optimism. First and foremost, {{arg1}}. Accordingly, it is imperative for us to {{action}}."
  },
  {
    id: "2013", year: "2013", title: "选择", mode: "Mode A", visualType: "image", description: "一群毕业生站在分岔路口，有人选择就业，有人选择考研，有人选择创业。",
    defaultImage: "/images/exam/2013.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述毕业生面临的选择。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：毕业生站在人生十字路口，面临多种选择..." },
      { id: "arg1", label: "核心意义", question: "为什么选择很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：选择决定人生方向，需要理性思考..." },
      { id: "action", label: "建议", question: "如何做出正确选择？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：结合兴趣和能力，做出适合自己的选择..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon showing graduates at a crossroads. Specifically, {{desc}}. The purpose is to illustrate the importance of making choices. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2014", year: "2014", title: "相携", mode: "Mode A", visualType: "image", description: "三十年前，年轻的母亲牵着女儿的手；三十年后，女儿牵着年迈的母亲的手。",
    defaultImage: "/images/exam/2014.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述两幅图的对比。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：三十年前母亲照顾女儿，三十年后女儿照顾母亲..." },
      { id: "arg1", label: "核心意义", question: "为什么孝道很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：孝道是中华民族的传统美德..." },
      { id: "action", label: "建议", question: "如何传承孝道？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：关爱父母，传承美德..." }
    ],
    templateString: "Unfolding before us is a touching cartoon showing the cycle of care. Specifically, {{desc}}. The purpose is to illustrate filial piety. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2015", year: "2015", title: "聚餐玩手机", mode: "Mode B", visualType: "image", description: "聚餐时大家都在玩手机，没人交流。",
    defaultImage: "/images/exam/2015.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述聚餐时的冷漠场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：虽然坐在一起，但都在低头看屏幕..." },
      { id: "harm", label: "危害分析", question: "手机沉迷有什么坏处？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：阻碍了面对面的情感交流..." },
      { id: "action", label: "建议", question: "如何改变？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：放下手机，回归现实..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon about 'phubbing'. Specifically, {{desc}}. The purpose is to illustrate the harm of mobile addiction. First and foremost, {{harm}}. It is this indifference that stifles communication. Accordingly, it is imperative to {{action}}."
  },
  {
    id: "2016", year: "2016", title: "父子看电视", mode: "Mode A", visualType: "image", description: "父亲边看电视边让儿子学习，儿子也学着看电视。",
    defaultImage: "/images/exam/2016.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述父子的行为对比。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：父亲在沙发上看电视，却命令儿子去读书..." },
      { id: "arg1", label: "核心论点", question: "为什么榜样很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：身教重于言教..." },
      { id: "action", label: "建议", question: "父母应该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：以身作则，言行一致..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the power of role models. First and foremost, {{arg1}}. Accordingly, parents should {{action}}."
  },
  {
    id: "2017", year: "2017", title: "有书与读书", mode: "Mode A", visualType: "image", description: "一个人坐在书堆前，书很多，但他在玩手机。",
    defaultImage: "/images/exam/2017.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述图画中的矛盾。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：面前有很多书，却在玩手机..." },
      { id: "harm", label: "问题分析", question: "这种现象有什么问题？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：拥有书不等于读书，需要实际行动..." },
      { id: "action", label: "建议", question: "如何培养阅读习惯？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：放下手机，静心阅读..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the gap between owning books and reading. First and foremost, {{harm}}. Accordingly, we should {{action}}."
  },
  {
    id: "2018", year: "2018", title: "选课进行时", mode: "Mode A", visualType: "image", description: "一个学生坐在电脑前选课，一边是\"知识新、重创新、有难度\"的课，一边是\"给分高、易通过、作业少\"的课。",
    defaultImage: "/images/exam/2018.jpg",
    slots: [
      { id: "desc", label: "图画描述", question: "描述学生选课时的两难选择。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：学生面临两种课程的选择..." },
      { id: "arg1", label: "核心意义", question: "为什么应该选择有挑战的课程？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：挑战促进成长，知识提升能力..." },
      { id: "action", label: "建议", question: "如何做出正确选择？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：选择有挑战的课程，追求真正的学习..." }
    ],
    templateString: "Unfolding before us is a cartoon about course selection. Specifically, {{desc}}. The purpose is to illustrate the importance of choosing challenging courses. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2019", year: "2019", title: "途中", mode: "Mode A", visualType: "image", description: "一个人在路上，前面是\"坚持\"，后面是\"放弃\"，他选择了坚持。",
    defaultImage: "/images/exam/2019.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述图画中的场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一个人在路上，面临坚持和放弃的选择..." },
      { id: "arg1", label: "核心意义", question: "为什么坚持很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：坚持是成功的关键，放弃意味着失败..." },
      { id: "action", label: "建议", question: "如何培养坚持的品质？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：设定目标，克服困难，永不放弃..." }
    ],
    templateString: "Unfolding before us is a cartoon about persistence. Specifically, {{desc}}. The purpose is to illustrate the value of perseverance. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2020", year: "2020", title: "习惯", mode: "Mode A", visualType: "image", description: "一个女孩坐在桌前，桌上有一本书，但她低头看手机。",
    defaultImage: "/images/exam/2020.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述图画中的场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：女孩面前有书，却在看手机..." },
      { id: "harm", label: "问题分析", question: "这种习惯有什么危害？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：手机成瘾影响学习，分散注意力..." },
      { id: "action", label: "建议", question: "如何改变不良习惯？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：培养良好习惯，合理使用手机..." }
    ],
    templateString: "Unfolding before us is a cartoon about habits. Specifically, {{desc}}. The purpose is to illustrate the impact of bad habits. First and foremost, {{harm}}. Accordingly, we should {{action}}."
  },
  {
    id: "2021", year: "2021", title: "兴趣", mode: "Mode A", visualType: "image", description: "一个孩子穿着戏曲服装，对父亲说很多同学觉得学唱戏不好玩，父亲鼓励他说只要自己喜欢就足够了。",
    defaultImage: "/images/exam/2021.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述父子关于学戏曲的对话。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：孩子担心同学觉得学唱戏不好玩，父亲鼓励他坚持自己的兴趣..." },
      { id: "arg1", label: "核心意义", question: "为什么坚持自己的兴趣很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：兴趣是最好的老师，坚持自己的选择才能获得真正的快乐..." },
      { id: "action", label: "建议", question: "如何对待自己的兴趣？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：不要被他人意见左右，坚持自己的热爱..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the importance of following one's own interests. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2022", year: "2022", title: "跨学科学习", mode: "Mode A", visualType: "image", description: "两个学生站在公告栏前，一个说不是我们专业的听了也没多大用，另一个说听听总会有好处。",
    defaultImage: "/images/exam/2022.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述两个学生对听讲座的不同态度。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一个学生认为非专业的讲座没用，另一个认为听听总会有好处..." },
      { id: "arg1", label: "核心意义", question: "为什么跨学科学习很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：跨学科学习能拓宽视野，促进创新思维..." },
      { id: "action", label: "建议", question: "如何培养跨学科学习的意识？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：保持开放心态，积极参与各类讲座和活动..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the importance of interdisciplinary learning. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2023", year: "2023", title: "传统文化复兴", mode: "Mode A", visualType: "image", description: "一位老人看着村里的龙舟比赛，感叹比赛越来越热闹了，很多人前来观看和参与。",
    defaultImage: "/images/exam/2023.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述龙舟比赛的热闹场景。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：村里的龙舟比赛越来越热闹，吸引了很多人前来观看..." },
      { id: "arg1", label: "核心意义", question: "为什么传统文化活动的复兴很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：传统文化是民族精神的载体，复兴有助于增强文化自信..." },
      { id: "action", label: "建议", question: "如何促进传统文化的传承与发展？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：积极参与传统活动，让传统文化在现代社会焕发新活力..." }
    ],
    templateString: "Unfolding before us is a thought-provoking cartoon. Specifically, {{desc}}. The purpose is to illustrate the revitalization of traditional culture. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2024", year: "2024", title: "创新", mode: "Mode A", visualType: "image", description: "一个创新者站在传统和创新的交界处，思考如何平衡。",
    defaultImage: "/images/exam/2024.png",
    slots: [
      { id: "desc", label: "图画描述", question: "描述创新者的处境。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：创新者站在传统与创新的交界处..." },
      { id: "arg1", label: "核心意义", question: "为什么创新很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：创新是发展的动力，推动社会进步..." },
      { id: "action", label: "建议", question: "如何培养创新能力？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：保持好奇心，勇于尝试，不断学习..." }
    ],
    templateString: "Unfolding before us is a cartoon about innovation. Specifically, {{desc}}. The purpose is to illustrate the importance of innovation. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "2025", year: "2025", title: "消费升级", mode: "Mode C", visualType: "table", description: "居民耐用消费品（空调、汽车等）拥有量逐年上升。",
    defaultImage: "https://placehold.co/800x400/e2e8f0/475569?text=2025+Exam:+Chart+Data",
    tableData: { headers: ["年份", "空调", "汽车", "电脑"], rows: [["2015", "80", "20", "50"], ["2024", "140", "60", "90"]] },
    slots: [
      { id: "desc", label: "数据描述", question: "描述数据的增长趋势。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：空调数量从80激增到140..." },
      { id: "reason", label: "原因分析", question: "为什么会增长？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：经济发展，收入增加..." },
      { id: "action", label: "建议/展望", question: "未来该怎么做？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：继续促进经济，提升生活质量..." }
    ],
    templateString: "Unfolding before us is a clear chart. Specifically, {{desc}}. The purpose is to illustrate improved living standards. First and foremost, {{reason}}. Accordingly, we should {{action}}."
  }
];

// 预测题数据
export const PREDICTION_DATA = [
  {
    id: "pred_ai", year: "2026预测", title: "AI与创造力", mode: "Mode A", visualType: "image", description: "AI瞬间作画 vs 老画家苦思冥想。",
    defaultImage: "https://placehold.co/800x400/e0e7ff/4338ca?text=2026+Prediction:+AI+vs+Human",
    slots: [
      { id: "desc", label: "对比描述", question: "对比AI的高效与人类的艰辛。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：机器人秒出图，画家耗尽一生..." },
      { id: "arg1", label: "深层含义", question: "人类创造力的价值？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：人类作品包含灵魂与情感..." },
      { id: "action", label: "态度", question: "如何看待技术？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：善用工具，坚守人文..." }
    ],
    templateString: "The cartoon presents a contrast between AI and human artistry. Specifically, {{desc}}. The purpose is to illustrate the value of creativity. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_culture", year: "2026预测", title: "文化双创", mode: "Mode A", visualType: "image", description: "京剧脸谱戴VR眼镜。",
    defaultImage: "https://placehold.co/800x400/fef3c7/b45309?text=2026+Prediction:+Culture+meets+VR",
    slots: [
      { id: "desc", label: "图画描述", question: "描述传统与科技的结合。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：古老的脸谱结合了现代VR技术..." },
      { id: "arg1", label: "创新价值", question: "为什么需要创新？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：科技让传统焕发新生..." },
      { id: "action", label: "建议", question: "如何传播文化？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：利用数字手段讲好中国故事..." }
    ],
    templateString: "Unfolding before us is a creative cartoon. Specifically, {{desc}}. The purpose is to illustrate cultural innovation. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_resilience", year: "2026预测", title: "内卷与韧性", mode: "Mode A", visualType: "image", description: "一人负重前行（内卷），一人轻装赏花（松弛）。",
    defaultImage: "https://placehold.co/800x400/ecfccb/3f6212?text=2026+Prediction:+Resilience",
    slots: [
      { id: "desc", label: "对比描述", question: "对比两种生活状态。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：一人被名利压垮，一人享受过程..." },
      { id: "arg1", label: "哲理解析", question: "为什么心理韧性很重要？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：过程比结果重要，心态决定生活质量..." },
      { id: "action", label: "建议", question: "如何保持韧性？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：拒绝无意义的竞争，寻找内心平静..." }
    ],
    templateString: "The cartoon highlights two attitudes towards life. Specifically, {{desc}}. The purpose is to illustrate psychological resilience. First and foremost, {{arg1}}. Accordingly, we should {{action}}."
  },
  {
    id: "pred_public", year: "2026预测", title: "公共素养", mode: "Mode B", visualType: "image", description: "图书馆大声打电话，旁若无人。",
    defaultImage: "https://placehold.co/800x400/fee2e2/991b1b?text=2026+Prediction:+Public+Spirit",
    slots: [
      { id: "desc", label: "场景描述", question: "描述不文明行为。", templateContext: "Specifically, [INSERT HERE].", placeholder: "例如：在安静的图书馆大声喧哗..." },
      { id: "harm", label: "危害分析", question: "这种行为有何危害？", templateContext: "First and foremost, [INSERT HERE].", placeholder: "例如：破坏公共秩序，体现素质缺失..." },
      { id: "action", label: "建议", question: "如何提升素养？", templateContext: "Accordingly, [INSERT HERE].", placeholder: "例如：遵守公共规则，尊重他人..." }
    ],
    templateString: "Unfolding before us is a scene revealing lack of public spirit. Specifically, {{desc}}. The purpose is to illustrate the importance of social morality. First and foremost, {{harm}}. Accordingly, we should {{action}}."
  }
];

// 合并所有题目数据
export const ALL_EXAM_DATA = [...EXAM_DATA, ...PREDICTION_DATA];

// 词汇列表
export const VOCAB_LISTS = [
  { 
    category: "个人品质", 
    words: [
      { word: "Perseverance", meaning: "坚持", col: "cultivate" }, 
      { word: "Optimism", meaning: "乐观", col: "maintain" }
    ] 
  },
  { 
    category: "社会公德", 
    words: [
      { word: "Integrity", meaning: "诚信", col: "adhere to" }, 
      { word: "Public Spirit", meaning: "公德", col: "enhance" }
    ] 
  }
];
