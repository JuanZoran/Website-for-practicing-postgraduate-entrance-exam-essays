const SEGMENT_KIND = {
  FIXED: 'fixed',
  VAR: 'var'
};

const fixed = (text) => ({ kind: SEGMENT_KIND.FIXED, text: String(text || '') });
const variable = (label, text, key = null) => ({
  kind: SEGMENT_KIND.VAR,
  label: String(label || ''),
  key: key ? String(key) : null,
  text: String(text || '')
});

const segmentsToText = (segments) => segments.map((s) => s.text).join('');

const blocksToText = (blocks) => blocks.map((b) => segmentsToText(b.segments)).join('\n\n');

const uniqueVarsFromSegments = (segments) => {
  const seen = new Set();
  const vars = [];
  for (const seg of segments) {
    if (seg.kind !== SEGMENT_KIND.VAR) continue;
    const id = seg.key || seg.label || seg.text;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    vars.push({ id, label: seg.label, value: seg.text });
  }
  return vars;
};

const MODE_A_THEMES = {
  culturalIntegration: {
    topic: 'cultural integration',
    focus: 'cultural integration',
    thesis: 'openness breeds prosperity',
    reason1: 'it allows civilizations to learn from one another and avoid prejudice',
    benefit1: 'broaden our horizons and enrich our spiritual world',
    negativeConsequence: 'we may become narrow-minded and miss valuable ideas',
    reason2:
      'it helps a nation build cultural confidence while embracing diversity',
    actionSuggestion:
      "stay open-minded, learn from others and tell China’s stories well",
    vision: 'build a harmonious global village'
  },
  optimism: {
    topic: 'optimism',
    focus: 'optimism',
    thesis: 'attitude determines everything',
    reason1: 'optimism serves as a mental shield when facing setbacks',
    benefit1: 'turn a crisis into an opportunity',
    negativeConsequence: 'we may be trapped in anxiety and miss possible solutions',
    reason2: 'it inspires us to act rather than complain',
    actionSuggestion: 'stay positive, learn from failures, and take practical action',
    vision:
      'navigate through the turbulent waves of life and reach the shore of success'
  },
  choice: {
    topic: 'sound judgment',
    focus: 'sound judgment',
    thesis: 'choices shape our destiny',
    reason1: 'sound judgment clarifies our direction when we stand at a crossroads',
    benefit1: 'allocate time and energy wisely',
    negativeConsequence: 'we may drift aimlessly and regret later',
    reason2: 'it reflects responsibility for ourselves and the future we desire',
    actionSuggestion:
      'weigh options with long-term vision and follow our inner calling',
    vision: 'step onto a path that leads to meaningful success'
  },
  gratitude: {
    topic: 'gratitude',
    focus: 'gratitude',
    thesis: 'love is a two-way journey',
    reason1: 'gratitude strengthens family bonds and warms our hearts',
    benefit1: 'cherish and repay those who care for us',
    negativeConsequence: 'relationships may turn cold and fragile',
    reason2: 'it is a moral virtue passed down through generations',
    actionSuggestion: 'show love through actions and care for our parents',
    vision: 'create a warm and caring society'
  },
  roleModel: {
    topic: 'setting a good example',
    focus: 'setting a good example',
    thesis: 'actions speak louder than words',
    reason1: 'children learn more from what we do than what we say',
    benefit1: 'build good habits and a responsible character',
    negativeConsequence: 'they may imitate bad behavior and lose direction',
    reason2: 'it applies to every adult as well',
    actionSuggestion: 'practice what we preach and lead by example',
    vision: 'nurture a generation with integrity'
  },
  selfDiscipline: {
    topic: 'self-discipline',
    focus: 'self-discipline',
    thesis: 'good habits make all the difference',
    reason1: 'self-discipline helps us resist distractions in the digital age',
    benefit1: 'stay focused and improve learning efficiency',
    negativeConsequence: 'we may waste time and fall behind',
    reason2: 'it enables lifelong learning amid information overload',
    actionSuggestion: 'put down the phone, read deeply and form steady routines',
    vision: 'accumulate knowledge and grow into better versions of ourselves'
  },
  challenge: {
    topic: 'the courage to embrace challenges',
    focus: 'the courage to embrace challenges',
    thesis: 'no pain, no gain',
    reason1: 'challenging choices expand our capabilities',
    benefit1: 'acquire real competence and creativity',
    negativeConsequence: 'comfort may trap us in mediocrity',
    reason2: 'it cultivates resilience and long-term vision',
    actionSuggestion:
      'step out of the comfort zone and choose what helps us grow',
    vision: 'become competitive talents in the future'
  },
  perseverance: {
    topic: 'perseverance',
    focus: 'perseverance',
    thesis: 'perseverance is the bridge between goals and achievements',
    reason1: 'perseverance keeps us moving when progress is slow',
    benefit1: 'break through bottlenecks and reach new heights',
    negativeConsequence: 'giving up makes all previous efforts meaningless',
    reason2: 'it turns dreams into reality through consistent action',
    actionSuggestion: 'set clear goals, stay persistent and embrace hardship',
    vision: 'reach the shore of success'
  },
  passion: {
    topic: 'passion',
    focus: 'passion',
    thesis: 'interest is the best teacher',
    reason1: 'passion fuels persistence and unleashes creativity',
    benefit1: 'learn with joy and achieve excellence',
    negativeConsequence: 'learning becomes a burden and we easily quit',
    reason2: 'it also helps preserve cultural heritage when passion meets tradition',
    actionSuggestion: 'respect individual interests and encourage long-term dedication',
    vision: 'let diverse talents blossom'
  },
  openMindedness: {
    topic: 'open-mindedness',
    focus: 'open-mindedness',
    thesis: 'learning knows no boundaries',
    reason1: 'an open mind enables cross-disciplinary thinking',
    benefit1: 'solve complex problems more effectively',
    negativeConsequence: 'narrow specialization may limit innovation',
    reason2: 'it prepares us for a fast-changing world',
    actionSuggestion: 'embrace interdisciplinary learning and stay curious',
    vision: 'keep pace with the era and create new possibilities'
  },
  culturalConfidence: {
    topic: 'cultural confidence',
    focus: 'cultural confidence',
    thesis: 'a nation thrives when its culture is alive',
    reason1: 'traditional culture strengthens identity and social cohesion',
    benefit1: 'inspire pride and moral values',
    negativeConsequence: 'cultural amnesia leaves us rootless',
    reason2: 'creative inheritance makes tradition relevant to modern life',
    actionSuggestion: 'participate in and promote tradition in innovative ways',
    vision: 'keep our heritage shining for generations'
  },
  innovation: {
    topic: 'innovation',
    focus: 'innovation',
    thesis: 'innovation drives progress',
    reason1: 'innovation improves efficiency and quality of life',
    benefit1: 'open new industries and opportunities',
    negativeConsequence: 'development stagnates and competitiveness declines',
    reason2: 'true innovation respects tradition while breaking new ground',
    actionSuggestion:
      'integrate tradition with new ideas and support bold attempts',
    vision: 'build a more dynamic and prosperous nation'
  },
  creativity: {
    topic: 'human creativity',
    focus: 'human creativity',
    thesis: 'technology empowers us, but creativity defines us',
    reason1: 'human creativity carries emotion, judgment and responsibility',
    benefit1: 'produce meaningful works beyond mere efficiency',
    negativeConsequence: 'overreliance may weaken imagination',
    reason2: 'AI should be a tool that amplifies, rather than replaces, ingenuity',
    actionSuggestion: 'embrace AI wisely while continuously cultivating creativity',
    vision: 'let technology and humanity advance together'
  },
  resilience: {
    topic: 'psychological resilience',
    focus: 'psychological resilience',
    thesis: 'a balanced mind makes a strong life',
    reason1: 'resilience helps us cope with pressure and uncertainty',
    benefit1: 'stay calm and make wise decisions',
    negativeConsequence: 'constant burnout leads to anxiety and collapse',
    reason2: 'it encourages sustainable effort and inner peace',
    actionSuggestion: 'set healthy goals, learn to relax, and build resilience',
    vision: 'live productively and happily'
  }
};

const MODE_A_META = {
  '2010': {
    theme: 'culturalIntegration',
    overview:
      'a huge hotpot filled with cultural symbols from both China and the West',
    detailA: 'various Chinese icons are boiling in the pot',
    detailB: 'Western elements are added to the mix in harmony'
  },
  '2012': {
    theme: 'optimism',
    overview: 'a toppled bottle triggers two opposite reactions',
    detailA: "one person sighs, claiming that everything is ruined",
    detailB: 'the other smiles, believing that half of it still remains'
  },
  '2013': {
    theme: 'choice',
    overview: 'a group of graduates stand at a crossroads of life',
    detailA: 'some head for employment right away',
    detailB: 'others choose postgraduate study or even start a business'
  },
  '2014': {
    theme: 'gratitude',
    overview: 'a mother and a daughter hold hands across three decades',
    detailA: 'thirty years ago, the young mother led the little girl forward',
    detailB: 'thirty years later, the grown-up daughter supports her aging mother'
  },
  '2016': {
    theme: 'roleModel',
    overview: 'a father urges his son to study while watching TV',
    detailA: 'the father watches TV and asks the boy to learn',
    detailB: 'the boy imitates him and watches TV too'
  },
  '2017': {
    theme: 'selfDiscipline',
    overview: 'a man sits before piles of books, yet he is glued to a smartphone',
    detailA: 'books tower around him, symbolizing abundant learning resources',
    detailB: 'instead of reading, he scrolls on his phone with full attention'
  },
  '2018': {
    theme: 'challenge',
    overview: 'a student chooses courses on a computer',
    detailA: 'one option promises fresh knowledge and innovation but is challenging',
    detailB: 'the other offers easy credits with little homework and high grades'
  },
  '2019': {
    theme: 'perseverance',
    overview: 'a traveler walks on a road with two striking signs',
    detailA: "the sign ahead reads 'Perseverance' and points to the future",
    detailB: "behind him stands another saying 'Give up' as a tempting retreat"
  },
  '2020': {
    theme: 'selfDiscipline',
    overview: 'a girl sits at a desk with a book, yet she is on her phone',
    detailA: 'the book lies open on the table',
    detailB: 'yet she keeps checking her smartphone'
  },
  '2021': {
    theme: 'passion',
    overview: 'a child in traditional opera costume talks with his father',
    detailA: 'he worries that classmates find learning opera boring and outdated',
    detailB: 'his father encourages him to follow his own passion regardless'
  },
  '2022': {
    theme: 'openMindedness',
    overview: 'two students stand before a bulletin board about a lecture',
    detailA: 'one dismisses it as irrelevant to their major',
    detailB: 'the other insists that listening will always be beneficial'
  },
  '2023': {
    theme: 'culturalConfidence',
    overview:
      'an elderly man watches a dragon boat race that has become increasingly lively',
    detailA: 'he marvels at the roaring crowd and the returning tradition',
    detailB: 'people of all ages come to watch, cheer and even join the race'
  },
  '2024': {
    theme: 'innovation',
    overview: 'an innovator stands at the boundary between tradition and innovation',
    detailA: 'tradition provides roots, experience and time-tested wisdom',
    detailB: 'innovation pushes forward with bold ideas and new methods'
  },
  pred_ai: {
    theme: 'creativity',
    overview: 'AI creates a painting in seconds while an old artist ponders for hours',
    detailA: 'a robot produces an artwork at lightning speed with a single click',
    detailB: 'the painter struggles thoughtfully, searching for inspiration'
  },
  pred_culture: {
    theme: 'culturalConfidence',
    overview: 'a Peking Opera mask wears a VR headset',
    detailA: 'the time-honored facial makeup symbolizes our cultural heritage',
    detailB: 'the VR device represents cutting-edge technology and innovation'
  },
  pred_resilience: {
    theme: 'resilience',
    overview: 'two people hold different attitudes toward life and competition',
    detailA: 'one staggers under a heavy load in the rat race',
    detailB: 'the other travels light and stops to enjoy flowers along the way'
  }
};

const MODE_B_THEMES = {
  littering: {
    themeWord: 'public spirit',
    phenomenon: 'littering in public places',
    harm1: 'it pollutes the environment and ruins the scenery',
    negativeAttribute: 'irresponsibility',
    goodThing: 'a clean ecosystem',
    target: 'our living environment and the image of tourism',
    worseConsequence:
      'the damage will accumulate and the next generation will pay the price',
    quote:
      'We do not inherit the earth from our ancestors; we borrow it from our children.',
    solution: 'stop littering and follow the rule of “leave no trace”',
    vision: 'protect our shared home and enjoy a cleaner world'
  },
  phoneAddiction: {
    themeWord: 'genuine communication',
    phenomenon: 'mobile phone addiction',
    harm1: 'it weakens face-to-face interaction and breeds loneliness',
    negativeAttribute: 'indifference',
    goodThing: 'warm communication',
    target: 'interpersonal relationships',
    worseConsequence:
      'people may become isolated even when surrounded by friends',
    quote:
      'Technology brings us closer to those far away, but pushes us away from those sitting next to us.',
    solution: 'put down phones and cherish face-to-face communication',
    vision: 'rebuild warm connections and mutual understanding'
  },
  publicManners: {
    themeWord: 'civility',
    phenomenon: 'uncivilized behavior in public spaces',
    harm1: 'it disturbs others and undermines public order',
    negativeAttribute: 'self-centeredness',
    goodThing: 'a quiet and respectful public environment',
    target: "others’ rights and social harmony",
    worseConsequence:
      'public spaces will become increasingly chaotic and stressful',
    quote: 'Civility costs nothing, yet buys everything.',
    solution: 'respect others and behave properly in public places',
    vision: 'build a harmonious and civilized society'
  }
};

const MODE_B_META = {
  '2011': {
    theme: 'littering',
    overview: 'tourists are enjoying a trip while tossing rubbish everywhere',
    detail:
      'despite the beautiful scenery, some people throw trash into the water',
    missingQuality: 'public spirit'
  },
  '2015': {
    theme: 'phoneAddiction',
    overview: 'a group of friends sit together at dinner, yet all stare at phones',
    detail:
      'they are physically close but emotionally distant, with barely any conversation',
    missingQuality: 'genuine communication'
  },
  pred_public: {
    theme: 'publicManners',
    overview: 'a person speaks loudly on the phone in a library, ignoring others',
    detail:
      'readers around look annoyed, while the caller behaves as if nobody else exists',
    missingQuality: 'civility'
  }
};

const MODE_C_META = {
  '2025': {
    chartTitle: 'household ownership of durable consumer goods',
    trend: 'the improvement of living standards',
    cause1:
      'economic growth has significantly increased people’s disposable income',
    result: 'afford more convenient and comfortable lifestyles',
    cause2:
      'technological progress and market competition have made products cheaper and better',
    suggestion: 'continue to promote high-quality development and rational consumption',
    vision: 'ensure a prosperous future for our nation'
  }
};

const buildModeABlocks = (meta) => {
  const theme = MODE_A_THEMES[meta.theme] || MODE_A_THEMES.optimism;
  return [
    {
      id: 'p1',
      title: '第一段：描述图画',
      subtitle: 'The Description',
      segments: [
        fixed('Unfolding before us is a thought-provoking cartoon: '),
        variable('一句话概括图画', meta.overview, 'overview'),
        fixed('. Specifically, '),
        variable('细节 A（动作/语言）', meta.detailA, 'detailA'),
        fixed(', whereas '),
        variable('细节 B（对比/呼应）', meta.detailB, 'detailB'),
        fixed(
          '. Simple as the picture is, the symbolic meaning behind it is strictly distinct.'
        )
      ]
    },
    {
      id: 'p2',
      title: '第二段：阐释意义',
      subtitle: 'The Interpretation',
      segments: [
        fixed('The primary purpose of the drawing is to illustrate that '),
        variable('核心论点', theme.thesis, 'thesis'),
        fixed(', or more specifically, the importance of '),
        variable('主题词', theme.topic, 'topic'),
        fixed(
          '. Why does this quality matter? The reasons can be listed as follows. First and foremost, '
        ),
        variable('论点 1（功能）', theme.reason1, 'reason1'),
        fixed('. It is '),
        variable('主题词（复现）', theme.focus, 'focus'),
        fixed(' that enables us to '),
        variable('好处 1', theme.benefit1, 'benefit1'),
        fixed('. Conversely, without it, '),
        variable('反面后果', theme.negativeConsequence, 'negativeConsequence'),
        fixed('. Furthermore, '),
        variable('论点 2（升华）', theme.reason2, 'reason2'),
        fixed(
          '. Just as a philosopher goes: "A thousand words will not leave so deep an impression as one deed."'
        )
      ]
    },
    {
      id: 'p3',
      title: '第三段：归纳建议',
      subtitle: 'The Comment',
      segments: [
        fixed('In view of the arguments above, we can conclude that '),
        variable('主题词（收束）', theme.topic, 'topic2'),
        fixed(' is of vital importance. Accordingly, it is imperative for us to '),
        variable('具体行动建议', theme.actionSuggestion, 'actionSuggestion'),
        fixed('. Only in this way can we '),
        variable('宏大愿景', theme.vision, 'vision'),
        fixed('.')
      ]
    }
  ];
};

const buildModeBBlocks = (meta) => {
  const theme = MODE_B_THEMES[meta.theme] || MODE_B_THEMES.phoneAddiction;
  return [
    {
      id: 'p1',
      title: '第一段：描述图画',
      subtitle: 'The Description',
      segments: [
        fixed('Unfolding before us is a thought-provoking cartoon: '),
        variable('一句话概括负面场景', meta.overview, 'overview'),
        fixed('. Specifically, '),
        variable('矛盾细节', meta.detail, 'detail'),
        fixed('. This phenomenon reveals a lack of '),
        variable('缺失的品质', meta.missingQuality, 'missingQuality'),
        fixed(
          '. Simple as the picture is, the symbolic meaning behind it is strictly distinct.'
        )
      ]
    },
    {
      id: 'p2',
      title: '第二段：分析危害',
      subtitle: 'The Analysis',
      segments: [
        fixed('The primary purpose of the drawing is to illustrate the detrimental effect of '),
        variable('负面现象', theme.phenomenon, 'phenomenon'),
        fixed(
          '. Why does this phenomenon matter? The reasons can be listed as follows. First and foremost, '
        ),
        variable('危害 1', theme.harm1, 'harm1'),
        fixed('. It is this '),
        variable('负面属性', theme.negativeAttribute, 'negativeAttribute'),
        fixed(' that stifles '),
        variable('被扼杀的美好', theme.goodThing, 'goodThing'),
        fixed(' and damages '),
        variable('伤害对象', theme.target, 'target'),
        fixed('. Furthermore, if this trend continues, '),
        variable('更严重后果', theme.worseConsequence, 'worseConsequence'),
        fixed('. Just as the saying goes: "'),
        variable('相关名言', theme.quote, 'quote'),
        fixed('"')
      ]
    },
    {
      id: 'p3',
      title: '第三段：建议措施',
      subtitle: 'The Solution',
      segments: [
        fixed('In view of the arguments above, we can conclude that the issue of '),
        variable('核心议题', theme.themeWord, 'themeWord'),
        fixed(
          ' is of vital importance. Accordingly, it is imperative for us to '
        ),
        variable('具体改正措施', theme.solution, 'solution'),
        fixed('. Only in this way can we '),
        variable('恢复美好愿景', theme.vision, 'vision'),
        fixed('.')
      ]
    }
  ];
};

const buildModeCBlocks = (data) => {
  const meta = MODE_C_META[data.id] || MODE_C_META['2025'];
  const rows = data.tableData?.rows || [];
  const [r1, r2] = rows;
  const year1 = r1?.[0] || '2015';
  const year2 = r2?.[0] || '2024';
  const ac1 = r1?.[1] || '80';
  const ac2 = r2?.[1] || '140';
  const car1 = r1?.[2] || '20';
  const car2 = r2?.[2] || '60';

  return [
    {
      id: 'p1',
      title: '第一段：描述数据',
      subtitle: 'The Data',
      segments: [
        fixed('Unfolding before us is a clear chart/table: the statistics of '),
        variable('图表标题', meta.chartTitle, 'chartTitle'),
        fixed('. Specifically, the number of air conditioners witnessed a dramatic increase, jumping from '),
        variable('空调（年份1）', ac1, 'ac1'),
        fixed(' in '),
        variable('年份1', year1, 'year1'),
        fixed(' to '),
        variable('空调（年份2）', ac2, 'ac2'),
        fixed(' in '),
        variable('年份2', year2, 'year2'),
        fixed('. Meanwhile, the figure of cars also experienced a steady climb during the same period, rising from '),
        variable('汽车（年份1）', car1, 'car1'),
        fixed(' to '),
        variable('汽车（年份2）', car2, 'car2'),
        fixed('.')
      ]
    },
    {
      id: 'p2',
      title: '第二段：分析原因',
      subtitle: 'The Causes',
      segments: [
        fixed('The primary purpose of the chart is to illustrate '),
        variable('趋势/寓意', meta.trend, 'trend'),
        fixed(
          '. Why does this phenomenon occur? The reasons can be listed as follows. First and foremost, '
        ),
        variable('原因 1（经济基础）', meta.cause1, 'cause1'),
        fixed('. It is the rapid economic growth that enables us to '),
        variable('结果', meta.result, 'result'),
        fixed('. Furthermore, '),
        variable('原因 2（科技/观念）', meta.cause2, 'cause2'),
        fixed(
          '. Technological advancement has also played a key role. Just as the data suggests, a better life is becoming accessible to every household.'
        )
      ]
    },
    {
      id: 'p3',
      title: '第三段：展望未来',
      subtitle: 'The Conclusion',
      segments: [
        fixed(
          'In view of the arguments above, we can conclude that this upward trend is of vital importance. Accordingly, it is imperative for us to '
        ),
        variable('建议/展望', meta.suggestion, 'suggestion'),
        fixed('. Only in this way can we '),
        variable('宏大愿景', meta.vision, 'vision'),
        fixed('.')
      ]
    }
  ];
};

const MODE_LABELS = {
  'Mode A': { label: 'Mode A', desc: '正面 / 抽象品质 / 对比类' },
  'Mode B': { label: 'Mode B', desc: '负面 / 社会问题类' },
  'Mode C': { label: 'Mode C', desc: '图表 / 数据变化类' }
};

export const getBuiltInEssayModel = (data) => {
  if (!data) {
    return { kind: 'essay', mode: '', modeDesc: '', blocks: [], text: '', segments: [], variables: [] };
  }

  const modeInfo = MODE_LABELS[data.mode] || MODE_LABELS['Mode A'];
  const blocks =
    data.mode === 'Mode B'
      ? buildModeBBlocks(MODE_B_META[data.id] || MODE_B_META['2015'])
      : data.mode === 'Mode C'
        ? buildModeCBlocks(data)
        : buildModeABlocks(MODE_A_META[data.id] || MODE_A_META['2012']);

  const text = blocksToText(blocks);
  const segments = [
    ...blocks.flatMap((b, idx) => (idx === 0 ? b.segments : [fixed('\n\n'), ...b.segments]))
  ];
  const variables = uniqueVarsFromSegments(segments);
  return {
    kind: 'essay',
    mode: modeInfo.label,
    modeDesc: modeInfo.desc,
    blocks,
    segments,
    variables,
    text
  };
};

export const getBuiltInEssayModelText = (data) => getBuiltInEssayModel(data).text;

const LETTER_SLOT_MODELS = {
  letter_2010: {
    purpose:
      'The conference will focus on cultural exchange and global cooperation, and your participation will help ensure a smooth and welcoming experience for all guests.',
    details:
      '1) have a good command of English;\n2) be warm-hearted, responsible and punctual;\n3) be able to communicate effectively and work in a team.',
    signup:
      'fill in the application form at the Student Union office (Room 305) or email it to volunteer@university.edu by November 20'
  },
  letter_2011: {
    movie: 'Crouching Tiger, Hidden Dragon',
    reason:
      'It vividly presents traditional values, elegant aesthetics and the spirit of Chinese martial arts, which I believe will deepen your understanding of our culture.',
    content:
      'it tells a story about love, loyalty and inner struggle, revolving around a legendary sword and the choices made by several heroes'
  },
  letter_2012: {
    welcome:
      'I would like to extend our warmest welcome to you and wish you a pleasant stay.',
    study:
      'make full use of the library and seminars, and consult professors when needed.',
    life:
      'keep an open mind, join student clubs, and make new friends in daily life.'
  },
  letter_2013: {
    invite:
      'invite you to serve as a judge for our English Speech Contest, which will be held by the Student Union.',
    details:
      'The theme is "Bridging Cultures through Communication". Each contestant will deliver a 5-minute speech followed by a brief Q&A session.',
    expect:
      'Should you be available, please confirm your attendance at your earliest convenience. Your support would be highly appreciated.'
  },
  letter_2014: {
    city: 'Xi’an',
    reason:
      'it is an ancient capital with profound history, breathtaking relics and delicious local cuisine.',
    tips:
      'visit the Terracotta Warriors and the City Wall, and try to travel in spring or autumn for the most pleasant weather.'
  },
  letter_2015: {
    resources:
      'a rich collection of books, electronic journals and well-known academic databases across various disciplines.',
    usage:
      'use the online reservation system for study rooms and explore the digital resources with your campus ID for efficient research.',
    help:
      'If you like, I can show you around the library and help you get familiar with the catalog and borrowing procedures.'
  },
  letter_2016: {
    book: 'The Economist Style Guide',
    reason:
      'it provides practical guidance on concise, accurate and idiomatic English, which is extremely helpful for improving both writing and vocabulary.',
    tips:
      'read one section a day, take notes of useful collocations, and try to rewrite short paragraphs to practice applying what you have learned.'
  },
  letter_2017: {
    place: 'the West Lake in Hangzhou',
    reason:
      'it combines natural beauty with rich cultural heritage, offering a perfect setting for academic visitors to relax and explore.',
    features:
      'its poetic scenery, historic temples and well-planned walking routes make it an unforgettable experience for first-time visitors.'
  },
  letter_2018: {
    apology:
      'express my sincerest apologies for losing the book you kindly lent me.',
    reason:
      'I mistakenly left it in a taxi after a seminar, and despite my efforts, I failed to retrieve it.',
    remedy:
      'purchase a new copy of the same edition immediately or compensate you in any way you consider appropriate.'
  },
  letter_2019: {
    purpose:
      'I hope the ideas below help.',
    suggestion1:
      'pre-training be provided and a mentoring system be established',
    suggestion2:
      'basic teaching materials and lesson plans be prepared in advance'
  },
  letter_2020: {
    purpose:
      'To enrich international students’ extracurricular activities and promote cultural exchange, the Student Union is going to hold a Singing Contest.',
    details:
      'Time: 7:00 p.m., December 18\nVenue: Main Auditorium\nActivities: Solo/Duet performances and a short interview with judges',
    encourage:
      'All students are welcome to participate. Those who are interested are encouraged to sign up via the campus portal before December 10.'
  },
  letter_2021: {
    invite:
      'invite you to deliver an academic lecture for graduate students at our university.',
    topic:
      'The lecture will focus on cutting-edge research methods and how to conduct high-quality academic writing.',
    logistics:
      'The lecture can be arranged on a weekday afternoon in the Lecture Hall of the Graduate School. All necessary equipment will be prepared, and we will cover your transportation expenses.'
  },
  letter_2022: {
    invite:
      'invite you to attend our online graduation ceremony and deliver a short speech to the graduates.',
    ceremony:
      'The ceremony will be held via Zoom on June 25 at 3:00 p.m., followed by student representatives’ speeches.',
    speech:
      'share a few words of encouragement and offer brief advice on future development.'
  },
  letter_2023: {
    purpose:
      'I hope the following ideas will be adopted.',
    activity1:
      'organize weekly outdoor sports sessions',
    activity2:
      'offer mindfulness workshops and set up peer-support groups'
  },
  letter_2024: {
    overview:
      'a comprehensive university with a long history, beautiful campus and a strong commitment to international academic exchange.',
    resources:
      'well-equipped laboratories, a modern library with extensive databases, and multiple research centers that encourage interdisciplinary collaboration.',
    welcome:
      'We sincerely welcome your visit and would be delighted to provide any assistance you may need during your stay.'
  }
};

export const getBuiltInLetterModelText = (data) => {
  if (!data) return '';
  const slotModel = LETTER_SLOT_MODELS[data.id];
  if (!slotModel || !data.templateString || !Array.isArray(data.slots)) {
    return '';
  }

  let text = data.templateString;
  for (const slot of data.slots) {
    const value = slotModel[slot.id] || '';
    text = text.replace(new RegExp(`{{${slot.id}}}`, 'g'), value);
  }

  const numericYear = /^\d{4}$/.test(String(data.year || '')) ? String(data.year) : '';
  text = text.replace(/\[Date\]/g, numericYear ? `December 1, ${numericYear}` : 'December 1');
  text = text.replace(/\[deadline\]/g, 'May 20');
  return text;
};

const applyLetterMetaReplacements = (text, data) => {
  const numericYear = /^\d{4}$/.test(String(data?.year || '')) ? String(data.year) : '';
  return String(text || '')
    .replace(/\[Date\]/g, numericYear ? `December 1, ${numericYear}` : 'December 1')
    .replace(/\[deadline\]/g, 'May 20');
};

export const getBuiltInLetterModel = (data) => {
  if (!data) {
    return { kind: 'letter', segments: [], variables: [], text: '', templateSegments: [] };
  }

  const slotModel = LETTER_SLOT_MODELS[data.id];
  if (!slotModel || !data.templateString || !Array.isArray(data.slots)) {
    return { kind: 'letter', segments: [], variables: [], text: '', templateSegments: [] };
  }

  const labelById = Object.fromEntries(data.slots.map((s) => [s.id, s.label]));
  const template = String(data.templateString || '');
  const regex = /{{([a-zA-Z0-9_]+)}}/g;

  const segments = [];
  let lastIndex = 0;
  let match = null;
  while ((match = regex.exec(template)) !== null) {
    const before = template.slice(lastIndex, match.index);
    if (before) segments.push(fixed(before));

    const slotId = match[1];
    const label = labelById[slotId] || slotId;
    const value = slotModel[slotId] || '';
    segments.push(variable(label, value, slotId));

    lastIndex = match.index + match[0].length;
  }
  const after = template.slice(lastIndex);
  if (after) segments.push(fixed(after));

  const normalizedSegments = segments.map((s) => ({
    ...s,
    text: applyLetterMetaReplacements(s.text, data)
  }));

  const text = segmentsToText(normalizedSegments);
  const variables = uniqueVarsFromSegments(normalizedSegments);

  return {
    kind: 'letter',
    segments: normalizedSegments,
    variables,
    text
  };
};
