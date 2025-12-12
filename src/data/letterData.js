/**
 * 考研英语小作文题目数据
 */

export const LETTER_TYPES = {
  suggestion: { 
    name: "建议信", 
    icon: "💡",
    register: "formal",
    keyElements: ["写信目的", "建议1+理由", "建议2+理由", "期待采纳"]
  },
  apology: { 
    name: "道歉信", 
    icon: "🙏",
    register: "formal",
    keyElements: ["直接道歉", "解释原因", "补救方案", "再次道歉"]
  },
  invitation: { 
    name: "邀请信", 
    icon: "📨",
    register: "formal",
    keyElements: ["发出邀请", "活动详情", "邀请原因", "期待回复"]
  },
  complaint: { 
    name: "投诉信", 
    icon: "📢",
    register: "formal",
    keyElements: ["说明问题", "影响描述", "要求解决", "限期回复"]
  },
  recommendation: { 
    name: "推荐信", 
    icon: "⭐",
    register: "formal",
    keyElements: ["推荐对象", "推荐理由", "具体优点", "总结推荐"]
  },
  gratitude: { 
    name: "感谢信", 
    icon: "❤️",
    register: "semi-formal",
    keyElements: ["表达感谢", "具体事项", "感受影响", "希望回报"]
  },
  inquiry: { 
    name: "询问信", 
    icon: "❓",
    register: "formal",
    keyElements: ["自我介绍", "询问目的", "具体问题", "感谢协助"]
  },
  notice: { 
    name: "通知", 
    icon: "📋",
    register: "formal",
    keyElements: ["标题+日期", "活动目的", "时间地点", "号召参与"]
  },
  application: { 
    name: "申请/求职信", 
    icon: "📄",
    register: "formal",
    keyElements: ["申请目的", "自身优势", "相关经历", "期待回复"]
  }
};

export const VOCAB_UPGRADES = {
  suggestion: {
    "suggest": ["propose", "put forward", "recommend"],
    "good idea": ["constructive suggestion", "feasible proposal"],
    "help": ["assist", "facilitate", "contribute to"],
    "think": ["believe", "deem", "hold the view that"],
    "important": ["vital", "crucial", "imperative"]
  },
  apology: {
    "sorry": ["sincerest apologies", "deeply regret"],
    "mistake": ["error", "oversight", "unfortunate occurrence"],
    "fix": ["remedy", "make up for", "rectify"]
  },
  invitation: {
    "invite": ["cordially invite", "have the honor to invite"],
    "come": ["grace us with your presence", "attend"],
    "hope": ["look forward to", "anticipate"]
  },
  gratitude: {
    "thank": ["express my heartfelt gratitude", "appreciate"],
    "help": ["invaluable assistance", "generous support"],
    "happy": ["delighted", "thrilled", "deeply touched"]
  },
  complaint: {
    "bad": ["unsatisfactory", "substandard", "defective"],
    "angry": ["dissatisfied", "disappointed", "frustrated"],
    "want": ["request", "demand", "insist on"]
  }
};

export const LETTER_TEMPLATES = {
  suggestion_formal: {
    name: "9分建议信模板",
    opener: "I am writing to present some constructive suggestions regarding [TOPIC], aiming to help improve the current situation and enhance [OUTCOME].",
    body: `Considering the actual circumstances, I would like to propose the following measures for your consideration.

First and foremost, it is highly recommended that [SUGGESTION 1]. Evidence suggests that this practice would [BENEFIT 1].

Furthermore, it would be beneficial if [SUGGESTION 2]. Such a change would not only [BENEFIT 2A] but also [BENEFIT 2B].`,
    closer: "I trust that these suggestions will be of value to you. Thank you for your time and consideration.",
    signOff: "Yours sincerely,\nLi Ming"
  },
  apology_formal: {
    name: "9分道歉信模板",
    opener: "I am writing to express my sincerest apologies for [MISCONDUCT]. I deeply regret any inconvenience or disruption this may have caused you.",
    body: `The reason for this unfortunate occurrence is that [REASON]. Please understand that this was by no means intentional.

To make up for this, I would like to [REMEDY]. I hope this solution meets with your approval.`,
    closer: "Once again, please accept my apologies. I assure you that such an error will not occur in the future.",
    signOff: "Yours sincerely,\nLi Ming"
  },
  invitation_formal: {
    name: "9分邀请信模板",
    opener: "On behalf of [ORGANIZATION], it gives me great honor to invite you to attend/speak at the [EVENT], which is scheduled to be held at [LOCATION] on [DATE].",
    body: `Given your distinguished expertise in the field of [FIELD], we believe your presence would be invaluable to all the attendees. The theme of this event is [THEME], and we would be thrilled if you could deliver a keynote speech regarding [TOPIC].

Please note that all accommodation and transportation expenses will be covered by the organizing committee.`,
    closer: "We would be grateful if you could confirm your attendance before [DEADLINE]. We eagerly look forward to your positive response.",
    signOff: "Yours sincerely,\nLi Ming"
  },
  complaint_formal: {
    name: "9分投诉信模板",
    opener: "I am writing to express my dissatisfaction regarding the [PRODUCT/SERVICE] I purchased from your store/company on [DATE].",
    body: `Unfortunately, [PROBLEM DESCRIPTION]. Despite my previous attempts to resolve this issue via customer service, it remains unaddressed. This has caused me significant inconvenience.

In light of these circumstances, I strongly request [SOLUTION]. I believe this is a reasonable request to protect my consumer rights.`,
    closer: "I hope you will look into this matter immediately and provide a satisfactory solution.",
    signOff: "Yours faithfully,\nLi Ming"
  },
  recommendation_formal: {
    name: "9分推荐信模板",
    opener: "I am writing to enthusiastically recommend [OBJECT/PERSON] to you. I am convinced that it/he/she is exactly what you are looking for.",
    body: `The primary reason for my recommendation is that [REASON 1]. In addition, [REASON 2].

I have personally benefited a great deal from it and I believe you will find it equally rewarding.`,
    closer: "I hope you will enjoy it as much as I did. Please feel free to share your thoughts with me afterwards.",
    signOff: "Yours sincerely,\nLi Ming"
  },
  gratitude_formal: {
    name: "9分感谢信模板",
    opener: "I am writing to express my heartfelt gratitude for your [HELP/HOSPITALITY] during [OCCASION].",
    body: `I was particularly impressed by [SPECIFIC DETAIL]. Your kindness has made a profound impact on me.

Without your generous assistance, I would not have been able to [ACHIEVEMENT].`,
    closer: "I hope to have the opportunity to reciprocate your kindness in the future. Please accept my sincere thanks once again.",
    signOff: "Yours sincerely,\nLi Ming"
  },
  inquiry_formal: {
    name: "9分询问信模板",
    opener: "I am writing to inquire about information regarding [TOPIC]. As a [IDENTITY], I am particularly interested in [ASPECT].",
    body: `Specifically, I would like to know [QUESTION 1]. Additionally, could you please inform me whether [QUESTION 2]?

Any information you could provide would be greatly appreciated.`,
    closer: "Thank you for your time and assistance. I look forward to your reply at your earliest convenience.",
    signOff: "Yours sincerely,\nLi Ming"
  },
  notice_formal: {
    name: "9分通知模板",
    opener: "To [PURPOSE], the [ORGANIZATION] has decided to host a [EVENT NAME].",
    body: `Detailed information regarding the event is as follows:
- Time: The event is scheduled for [TIME].
- Venue: It will take place at [LOCATION].
- Activities: Participants will have the opportunity to [ACTIVITIES].`,
    closer: "All students/members are welcome to participate. Those who are interested should sign up at [LOCATION] before the deadline of [DATE].",
    signOff: "[ORGANIZATION]"
  }
};

export const INITIAL_LETTER_DATA = [
  {
    id: "letter_2010",
    year: "2010",
    title: "招募志愿者",
    type: "notice",
    category: "notice",
    register: "formal",
    scenario: "你是学生会主席，学校将举办国际会议，需要招募志愿者。请写一则通知。",
    requirements: [
      "说明会议基本信息",
      "列出志愿者要求",
      "说明报名方式"
    ],
    slots: [
      { id: "purpose", label: "通知目的", question: "招募志愿者的目的是什么？", placeholder: "例如：为国际会议招募志愿者..." },
      { id: "details", label: "具体要求", question: "志愿者需要具备什么条件？", placeholder: "例如：英语流利、善于沟通..." },
      { id: "signup", label: "报名方式", question: "如何报名？", placeholder: "例如：填写表格、联系方式..." }
    ],
    templateString: `Notice

[Date]

To recruit volunteers for the upcoming International Conference, the Student Union is now looking for qualified candidates.

{{purpose}}

Requirements for applicants are as follows:
{{details}}

Those who are interested should {{signup}}.

Student Union`
  },
  {
    id: "letter_2011",
    year: "2011",
    title: "推荐电影",
    type: "recommendation",
    category: "letters",
    register: "semi-formal",
    recipient: { title: "Dear [Friend's Name],", relationship: "friend" },
    scenario: "你的朋友想了解中国文化，请给他/她写信推荐一部电影。",
    requirements: [
      "推荐一部电影",
      "说明推荐理由",
      "简要介绍电影内容"
    ],
    slots: [
      { id: "movie", label: "推荐电影", question: "推荐哪部电影？", placeholder: "例如：《卧虎藏龙》..." },
      { id: "reason", label: "推荐理由", question: "为什么推荐这部电影？", placeholder: "例如：展现中国传统文化、武术精神..." },
      { id: "content", label: "电影内容", question: "电影主要讲什么？", placeholder: "例如：讲述了一个关于武侠的故事..." }
    ],
    templateString: `Dear friend,

I hope this letter finds you well. I am writing to enthusiastically recommend a Chinese film that I believe you will find fascinating.

The movie I would like to recommend is {{movie}}. {{reason}}

As for the plot, {{content}}

I am confident that this film will give you a deeper understanding of Chinese culture. I hope you will enjoy it as much as I did.

Yours,
Li Ming`
  },
  {
    id: "letter_2012",
    year: "2012",
    title: "欢迎留学生",
    type: "suggestion",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear International Students,", relationship: "group" },
    scenario: "你是学生会主席，请给新到的留学生写一封欢迎信，并给出一些学习和生活方面的建议。",
    requirements: [
      "表示欢迎",
      "给出学习建议",
      "给出生活建议"
    ],
    slots: [
      { id: "welcome", label: "欢迎语", question: "如何表达欢迎？", placeholder: "例如：代表学生会热烈欢迎..." },
      { id: "study", label: "学习建议", question: "学习方面有什么建议？", placeholder: "例如：多参加讨论、利用图书馆资源..." },
      { id: "life", label: "生活建议", question: "生活方面有什么建议？", placeholder: "例如：尝试当地美食、参加社团活动..." }
    ],
    templateString: `Dear International Students,

On behalf of the Student Union, {{welcome}}

To help you adapt to your new academic environment, I would like to offer some suggestions. First and foremost, {{study}}

Furthermore, regarding your daily life here, {{life}}

I trust that you will have a wonderful and enriching experience at our university. Please feel free to contact us if you need any assistance.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2013",
    year: "2013",
    title: "邀请参加比赛",
    type: "invitation",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Professor [Name],", relationship: "professor" },
    scenario: "你是学生会主席，请邀请一位外籍专家担任英语演讲比赛的评委。",
    requirements: [
      "发出邀请",
      "说明比赛详情",
      "期待回复"
    ],
    slots: [
      { id: "invite", label: "邀请语", question: "如何发出邀请？", placeholder: "例如：诚挚邀请您担任评委..." },
      { id: "details", label: "比赛详情", question: "比赛的时间、地点、主题是什么？", placeholder: "例如：时间地点、比赛流程..." },
      { id: "expect", label: "期待回复", question: "如何礼貌地期待回复？", placeholder: "例如：期待您的回复、确认出席..." }
    ],
    templateString: `Dear Professor,

On behalf of the Student Union, it gives me great honor to {{invite}}

The English Speech Contest is scheduled to be held at the Main Auditorium on December 20th. {{details}}

Given your distinguished expertise in the field of English education, we believe your presence would be invaluable to all the participants.

{{expect}}

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2014",
    year: "2014",
    title: "介绍城市",
    type: "recommendation",
    category: "letters",
    register: "semi-formal",
    recipient: { title: "Dear [Friend's Name],", relationship: "friend" },
    scenario: "你的外国朋友计划来中国旅游，请写信向他/她推荐一个城市。",
    requirements: [
      "推荐一个城市",
      "说明推荐理由",
      "提供旅游建议"
    ],
    slots: [
      { id: "city", label: "推荐城市", question: "推荐哪个城市？", placeholder: "例如：北京、西安..." },
      { id: "reason", label: "推荐理由", question: "为什么推荐这个城市？", placeholder: "例如：历史悠久、美食丰富..." },
      { id: "tips", label: "旅游建议", question: "有什么旅游建议？", placeholder: "例如：必去景点、最佳季节..." }
    ],
    templateString: `Dear friend,

I am delighted to hear that you are planning to visit China. I would like to recommend {{city}} as your destination.

The primary reason for my recommendation is that {{reason}}

As for travel tips, {{tips}}

I am confident that you will have an unforgettable experience there. Please feel free to contact me if you need more information.

Yours,
Li Ming`
  },
  {
    id: "letter_2015",
    year: "2015",
    title: "推荐图书馆",
    type: "recommendation",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear [Name],", relationship: "colleague" },
    scenario: "你的外国同事想了解学校图书馆的资源，请写信向他/她介绍并推荐。",
    requirements: [
      "介绍图书馆资源",
      "推荐使用方法",
      "提供帮助"
    ],
    slots: [
      { id: "resources", label: "馆藏资源", question: "图书馆有哪些资源？", placeholder: "例如：丰富的藏书、电子数据库..." },
      { id: "usage", label: "使用建议", question: "如何更好地使用图书馆？", placeholder: "例如：预约系统、自习室..." },
      { id: "help", label: "提供帮助", question: "你能提供什么帮助？", placeholder: "例如：带他参观、解答疑问..." }
    ],
    templateString: `Dear colleague,

I am writing to introduce our university library, which I believe will be of great help to your research.

Our library boasts {{resources}}

To make the best use of these resources, I would suggest that {{usage}}

{{help}}

Please feel free to contact me if you have any questions.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2016",
    year: "2016",
    title: "推荐书籍",
    type: "recommendation",
    category: "letters",
    register: "semi-formal",
    recipient: { title: "Dear [Friend's Name],", relationship: "friend" },
    scenario: "你的朋友想提高英语水平，请写信向他/她推荐一本书。",
    requirements: [
      "推荐一本书",
      "说明推荐理由",
      "给出阅读建议"
    ],
    slots: [
      { id: "book", label: "推荐书籍", question: "推荐哪本书？", placeholder: "例如：《老人与海》..." },
      { id: "reason", label: "推荐理由", question: "为什么推荐这本书？", placeholder: "例如：语言简洁优美、适合学习英语..." },
      { id: "tips", label: "阅读建议", question: "如何阅读这本书？", placeholder: "例如：慢慢读、做笔记..." }
    ],
    templateString: `Dear friend,

Knowing that you are eager to improve your English, I am writing to recommend a book that has benefited me greatly.

The book I would like to recommend is {{book}}. {{reason}}

As for reading tips, {{tips}}

I am confident that this book will be a great help to you. I hope you will enjoy it as much as I did.

Yours,
Li Ming`
  },
  {
    id: "letter_2017",
    year: "2017",
    title: "推荐旅游景点",
    type: "recommendation",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Professor,", relationship: "professor" },
    scenario: "学校将组织留学生参观旅游景点，请你写信给外国教授推荐一个景点。",
    requirements: [
      "推荐一个景点",
      "说明推荐理由",
      "描述景点特色"
    ],
    slots: [
      { id: "place", label: "推荐景点", question: "推荐哪个景点？", placeholder: "例如：长城、故宫..." },
      { id: "reason", label: "推荐理由", question: "为什么推荐这个景点？", placeholder: "例如：历史意义、文化价值..." },
      { id: "features", label: "景点特色", question: "景点有什么特色？", placeholder: "例如：壮观的建筑、美丽的风景..." }
    ],
    templateString: `Dear Professor,

I am writing to recommend {{place}} as the destination for the upcoming excursion for international students.

The primary reason for my recommendation is that {{reason}}

As for its distinctive features, {{features}}

I am confident that this trip will provide the students with an unforgettable cultural experience.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2018",
    year: "2018",
    title: "道歉信",
    type: "apology",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Professor [Name],", relationship: "professor" },
    scenario: "你借了教授的书籍但不慎丢失，请写信道歉。",
    requirements: [
      "表达歉意",
      "解释原因",
      "提出补救措施"
    ],
    slots: [
      { id: "apology", label: "道歉", question: "如何表达歉意？", placeholder: "例如：对丢失书籍深表歉意..." },
      { id: "reason", label: "原因", question: "书籍是如何丢失的？", placeholder: "例如：搬家时不慎遗失..." },
      { id: "remedy", label: "补救措施", question: "你打算如何补救？", placeholder: "例如：购买新书赔偿..." }
    ],
    templateString: `Dear Professor,

I am writing to express my sincerest apologies for losing the book you kindly lent me. {{apology}}

The reason for this unfortunate occurrence is that {{reason}}. Please understand that this was by no means intentional.

To make up for this loss, {{remedy}}

Once again, please accept my apologies. I assure you that I will be more careful in the future.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2019",
    year: "2019",
    title: "志愿者项目建议",
    type: "suggestion",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Sir or Madam,", relationship: "organization" },
    scenario: "学校志愿者协会正在征集乡村支教项目的改进建议，请写信提出你的建议。",
    requirements: [
      "说明写信目的",
      "提出具体建议",
      "说明预期效果"
    ],
    slots: [
      { id: "purpose", label: "写信目的", question: "写信的目的是什么？", placeholder: "例如：提出关于乡村支教项目的改进建议..." },
      { id: "suggestion1", label: "建议一", question: "第一条建议是什么？", placeholder: "例如：加强志愿者培训..." },
      { id: "suggestion2", label: "建议二", question: "第二条建议是什么？", placeholder: "例如：增加教学资源..." }
    ],
    templateString: `Dear Sir or Madam,

I am writing to present some constructive suggestions regarding the rural teaching volunteer project. {{purpose}}

Considering the actual circumstances, I would like to propose the following measures for your consideration.

First and foremost, it is highly recommended that {{suggestion1}}. This practice would significantly improve the teaching quality.

Furthermore, it would be beneficial if {{suggestion2}}. Such a change would not only enhance the learning experience but also benefit the local students.

I trust that these suggestions will be of value to the project. Thank you for your time and consideration.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2020",
    year: "2020",
    title: "活动通知",
    type: "notice",
    category: "notice",
    register: "formal",
    scenario: "你是学生会主席，学校将为国际学生举办歌唱比赛，请写一则通知。",
    requirements: [
      "说明活动目的",
      "介绍活动详情",
      "鼓励参与"
    ],
    slots: [
      { id: "purpose", label: "活动目的", question: "举办比赛的目的是什么？", placeholder: "例如：丰富校园文化、促进交流..." },
      { id: "details", label: "活动详情", question: "比赛的时间、地点、流程是什么？", placeholder: "例如：时间地点、报名方式..." },
      { id: "encourage", label: "鼓励参与", question: "如何鼓励大家参与？", placeholder: "例如：丰厚奖品、展示才华的机会..." }
    ],
    templateString: `Notice

[Date]

To enrich the campus life of international students, the Student Union will host a Singing Contest. {{purpose}}

Detailed information regarding the event is as follows:
{{details}}

{{encourage}}

All international students are welcome to participate. We look forward to your active participation!

Student Union`
  },
  {
    id: "letter_2021",
    year: "2021",
    title: "邀请参加讲座",
    type: "invitation",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Dr. [Name],", relationship: "expert" },
    scenario: "你是研究生会主席，请邀请一位专家为研究生做学术讲座。",
    requirements: [
      "发出邀请",
      "介绍讲座主题",
      "期待回复"
    ],
    slots: [
      { id: "invite", label: "邀请语", question: "如何发出邀请？", placeholder: "例如：诚挚邀请您做学术讲座..." },
      { id: "topic", label: "讲座主题", question: "讲座的主题和内容是什么？", placeholder: "例如：关于某领域的前沿研究..." },
      { id: "logistics", label: "后勤安排", question: "时间地点和相关安排是什么？", placeholder: "例如：时间、地点、费用报销..." }
    ],
    templateString: `Dear Dr.,

On behalf of the Graduate Student Union, it gives me great honor to {{invite}}

{{topic}}

Given your distinguished expertise in this field, we believe your insights would be invaluable to all the graduate students.

{{logistics}}

We would be grateful if you could confirm your availability before [deadline]. We eagerly look forward to your positive response.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2022",
    year: "2022",
    title: "邀请参加在线会议",
    type: "invitation",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Professor [Name],", relationship: "professor" },
    scenario: "你是学生会主席，请邀请一位教授参加学生的在线毕业典礼并致辞。",
    requirements: [
      "发出邀请",
      "说明典礼详情",
      "期待回复"
    ],
    slots: [
      { id: "invite", label: "邀请语", question: "如何发出邀请？", placeholder: "例如：诚挚邀请您参加毕业典礼并致辞..." },
      { id: "ceremony", label: "典礼详情", question: "典礼的时间和流程是什么？", placeholder: "例如：在线形式、时间安排..." },
      { id: "speech", label: "致辞要求", question: "对致辞有什么期望？", placeholder: "例如：寄语毕业生、分享经验..." }
    ],
    templateString: `Dear Professor,

On behalf of the Student Union, it gives me great honor to {{invite}}

Due to the special circumstances, our graduation ceremony will be held online this year. {{ceremony}}

We would be deeply honored if you could {{speech}}

We would be grateful if you could confirm your attendance by [deadline]. We eagerly look forward to your positive response.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2023",
    year: "2023",
    title: "活动建议",
    type: "suggestion",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Editor,", relationship: "editor" },
    scenario: "学校英文报正在征集关于促进学生身心健康活动的建议，请写信提出你的建议。",
    requirements: [
      "说明写信目的",
      "提出具体活动建议",
      "说明活动意义"
    ],
    slots: [
      { id: "purpose", label: "写信目的", question: "写信的目的是什么？", placeholder: "例如：为促进学生身心健康提出活动建议..." },
      { id: "activity1", label: "活动一", question: "第一个活动建议是什么？", placeholder: "例如：户外运动、心理讲座..." },
      { id: "activity2", label: "活动二", question: "第二个活动建议是什么？", placeholder: "例如：社团活动、志愿服务..." }
    ],
    templateString: `Dear Editor,

I am writing to present some suggestions regarding activities to promote students' physical and mental health. {{purpose}}

Considering the current situation, I would like to propose the following activities for your consideration.

First and foremost, it is highly recommended that the university {{activity1}}. This would help students relieve stress and maintain physical fitness.

Furthermore, it would be beneficial if {{activity2}}. Such activities would not only improve mental health but also foster a sense of community.

I trust that these suggestions will be of value. Thank you for your time and consideration.

Yours sincerely,
Li Ming`
  },
  {
    id: "letter_2024",
    year: "2024",
    title: "介绍大学",
    type: "recommendation",
    category: "letters",
    register: "formal",
    recipient: { title: "Dear Professor,", relationship: "professor" },
    scenario: "你是学校接待办公室的学生助理，外国访问学者将来校访问，请写信介绍学校情况。",
    requirements: [
      "介绍学校概况",
      "介绍学术资源",
      "表示欢迎和提供帮助"
    ],
    slots: [
      { id: "overview", label: "学校概况", question: "学校有什么基本情况？", placeholder: "例如：历史悠久、学科齐全..." },
      { id: "resources", label: "学术资源", question: "学校有哪些学术资源？", placeholder: "例如：图书馆、实验室、学术交流..." },
      { id: "welcome", label: "欢迎语", question: "如何表示欢迎？", placeholder: "例如：期待来访、提供帮助..." }
    ],
    templateString: `Dear Professor,

On behalf of the Reception Office, I am delighted to provide you with some information about our university before your upcoming visit.

{{overview}}

Regarding academic resources, {{resources}}

{{welcome}}

Please feel free to contact me if you have any questions or need further information. We are looking forward to welcoming you to our campus.

Yours sincerely,
Li Ming`
  }
];
