/* ============================================================
   光芽小院 · 游戏数据
   植物、夜霉、关卡与教学文案都集中在这里。
   ============================================================ */
(function (global) {
  "use strict";

  const Sunbud = (global.Sunbud = global.Sunbud || {});

  const plants = {
    sunbud: {
      id: "sunbud",
      name: "向日芽",
      en: "SUNBUD",
      tag: "阳光 · 经济",
      cost: 50,
      cooldown: 5,
      hp: 110,
      produce: { value: 25, interval: 10.5, first: 4.6 },
      desc: "把阳光酿进花盘里。每隔一会儿结出一枚可收集的小太阳。",
      detail: "开局多种两株，花园会慢慢变得从容。"
    },
    peapod: {
      id: "peapod",
      name: "豆荚射手",
      en: "PEAPOD",
      tag: "直线 · 输出",
      cost: 100,
      cooldown: 5,
      hp: 160,
      attack: { interval: 1.4, damage: 24, projectileSpeed: 680 },
      desc: "把青豆含在嘴里，向同一行的夜霉吐出。稳定、便宜、可靠。",
      detail: "花园的主力输出。"
    },
    frostbell: {
      id: "frostbell",
      name: "寒露铃",
      en: "FROSTBELL",
      tag: "减速 · 控制",
      cost: 150,
      cooldown: 7,
      hp: 140,
      attack: { interval: 1.8, damage: 18, projectileSpeed: 620, slow: 0.46, slowTime: 3.6 },
      desc: "摇响一枚冰凉的小铃，霜露会让夜霉的脚步慢下来。",
      detail: "先减速，再输出，往往能把危险拖成机会。"
    },
    nutshell: {
      id: "nutshell",
      name: "坚果墩",
      en: "NUTSHELL",
      tag: "防线 · 高耐久",
      cost: 75,
      cooldown: 9,
      hp: 1250,
      desc: "一颗有点怕痒的硬壳果。不攻击，但能替后排挡下很多口。",
      detail: "种在射手前面。裂开时说明它正在认真工作。"
    },
    popberry: {
      id: "popberry",
      name: "噼啪莓",
      en: "POPBERRY",
      tag: "一次 · 范围爆发",
      cost: 150,
      cooldown: 20,
      hp: 9999,
      explode: { delay: 0.75, damage: 1900, radius: 150 },
      desc: "憋着一肚子火花。种下后立刻炸开，清掉身边一整片夜霉。",
      detail: "救命用。别等到最后一口才想起它。"
    },
    thornspud: {
      id: "thornspud",
      name: "刺刺薯",
      en: "THORNSPUD",
      tag: "埋伏 · 一次性",
      cost: 25,
      cooldown: 12,
      hp: 150,
      mine: { armTime: 6, damage: 2600, radius: 90 },
      desc: "躲进土里，把自己变成一颗带刺的惊喜。需要一点时间上膛。",
      detail: "种在夜霉必经之路上，然后别盯着它看。"
    },
    twinpod: {
      id: "twinpod",
      name: "双生豆荚",
      en: "TWINPOD",
      tag: "双发 · 进阶输出",
      cost: 200,
      cooldown: 10,
      hp: 160,
      attack: { interval: 1.65, damage: 18, projectileSpeed: 700, shots: 2 },
      desc: "两个脑袋，两颗豆子，一次争吵就能喷出两发。",
      detail: "比豆荚射手贵，但火力也是实打实的两倍。"
    },
    dandelion: {
      id: "dandelion",
      name: "绒绒炮",
      en: "PUFF MORTAR",
      tag: "抛射 · 跨行支援",
      cost: 225,
      cooldown: 11,
      hp: 150,
      attack: { interval: 2.8, damage: 52, splashRadius: 92, projectileSpeed: 480 },
      desc: "把蒲公英绒团高高抛起，砸向最靠近小院的那一行夜霉。",
      detail: "唯一能跨行支援的植物。适合补漏。"
    },
    ripplily: {
      id: "ripplily",
      name: "涟漪莲",
      en: "RIPPLE LOTUS",
      tag: "水花 · 邻行溅射",
      cost: 175,
      cooldown: 11,
      hp: 160,
      attack: { interval: 2.9, damage: 26, projectileSpeed: 470, splash: 18, splashRadius: 112 },
      desc: "吐出一颗水珠，命中后溅到相邻两行。适合守在不规则的花廊里。",
      detail: "水花会同时打湿目标所在行与上下两行。"
    },
    prismbloom: {
      id: "prismbloom",
      name: "棱镜花",
      en: "PRISM BLOOM",
      tag: "穿透 · 整行",
      cost: 250,
      cooldown: 14,
      hp: 160,
      attack: { interval: 3.3, damage: 50 },
      desc: "把星光折成一束，贯穿同行的所有夜霉。越拥挤，越能看出棱镜的锋利。",
      detail: "没有弹道，命中整行。越早种下，越早照见危险。"
    },
    dawnbell: {
      id: "dawnbell",
      name: "破晓钟",
      en: "DAWN BELL",
      tag: "钟波 · 三行",
      cost: 300,
      cooldown: 22,
      hp: 260,
      pulse: { interval: 8, damage: 55 },
      desc: "把清晨藏在一口铜钟里。每隔一会儿敲响钟波，撼动所在行和上下两行。",
      detail: "钟波覆盖三行，是钟楼前的最后一道回答。"
    }
  };

  const enemies = {
    mutterling: {
      id: "mutterling",
      name: "咕哝团",
      hp: 200,
      speed: 24,
      bite: 16,
      biteInterval: 0.78,
      bounty: "基础",
      scale: 1
    },
    crateling: {
      id: "crateling",
      name: "纸箱客",
      hp: 460,
      speed: 20,
      bite: 22,
      biteInterval: 0.82,
      armor: "crate",
      scale: 1.04
    },
    canhead: {
      id: "canhead",
      name: "铁罐客",
      hp: 1080,
      speed: 16,
      bite: 28,
      biteInterval: 0.9,
      armor: "can",
      scale: 1.08
    },
    zippy: {
      id: "zippy",
      name: "疾风崽",
      hp: 150,
      speed: 50,
      bite: 10,
      biteInterval: 0.52,
      scale: 0.9
    },
    herald: {
      id: "herald",
      name: "摇旗手",
      hp: 430,
      speed: 25,
      bite: 18,
      biteInterval: 0.8,
      scale: 1.12
    },
    mossguard: {
      id: "mossguard",
      name: "苔甲卫",
      hp: 1700,
      speed: 13,
      bite: 34,
      biteInterval: 0.94,
      armor: "stone",
      scale: 1.12
    },
    boss: {
      id: "boss",
      name: "月蚀吞噬者",
      hp: 6600,
      speed: 11,
      bite: 65,
      biteInterval: 1.05,
      scale: 1,
      artScale: 1.03,
      boss: true
    },
    bellwarden: {
      id: "bellwarden",
      name: "永夜钟守",
      hp: 6400,
      speed: 9,
      bite: 70,
      biteInterval: 1.05,
      scale: 1,
      artScale: 0.98,
      boss: true
    }
  };

  const levels = [
    {
      id: 1,
      code: "01",
      name: "晨光草坪",
      en: "MORNING LAWN",
      theme: "morning",
      difficulty: 1,
      desc: "露水还没干，篱笆外传来第一阵沙沙声。",
      startSun: 125,
      firstWaveDelay: 24,
      betweenWaves: 10,
      skySunInterval: [8.5, 12.5],
      hpMul: 1,
      speedMul: 1,
      loadout: ["sunbud", "peapod", "nutshell", "popberry"],
      unlock: [],
      intro: {
        kicker: "晨光草坪 · 第 1 关",
        title: "把第一颗种子叫醒",
        lore: "月蚀前的最后一个早晨。篱笆外传来窸窣声——夜霉团闻到了阳光的味道。先种下向日芽，再让豆荚射手站到前面去。",
        goals: ["守住 3 波夜霉", "认识 4 种植物", "每行一台割草机"]
      },
      waves: [
        {
          name: "第 1 波",
          kicker: "WAVE 01",
          title: "叶下沙沙",
          groups: [{ type: "mutterling", count: 4, gap: 2.9, start: 0.2 }]
        },
        {
          name: "第 2 波",
          kicker: "WAVE 02",
          title: "纸箱来客",
          groups: [
            { type: "mutterling", count: 5, gap: 2.2, start: 0 },
            { type: "crateling", count: 2, gap: 4.3, start: 2 }
          ]
        },
        {
          name: "第 3 波",
          kicker: "FINAL WAVE",
          title: "黄昏前的冲刺",
          groups: [
            { type: "mutterling", count: 6, gap: 1.9, start: 0 },
            { type: "crateling", count: 3, gap: 3.4, start: 1.8 },
            { type: "zippy", count: 2, gap: 3.4, start: 3.2 }
          ]
        }
      ],
      completion: "晨光重新铺满草坪，寒露铃在篱笆边轻轻响了一声。",
      tips: {
        start: "先收集落下的阳光。第一株向日芽只要 50 阳光。",
        firstSun: "阳光可以点击收集。攒够 100，就种一株豆荚射手。",
        firstPlant: "豆荚射手会朝同一行的夜霉吐豆子。给每行都安排一株吧。",
        firstWave: "夜霉团从右边来了。别让它们走到左边的小屋。"
      }
    },
    {
      id: 2,
      code: "02",
      name: "萤火苗圃",
      en: "FIREFLY PLOT",
      theme: "dusk",
      difficulty: 2,
      desc: "萤火虫点亮了薄暮。能减速的寒露铃，与会埋伏的刺刺薯。",
      startSun: 150,
      firstWaveDelay: 22,
      betweenWaves: 9,
      skySunInterval: [8, 11.5],
      hpMul: 1.1,
      speedMul: 1.05,
      loadout: ["sunbud", "peapod", "frostbell", "nutshell", "thornspud", "popberry"],
      unlock: ["frostbell", "thornspud"],
      intro: {
        kicker: "萤火苗圃 · 第 2 关",
        title: "让霜露和萤火一起站岗",
        lore: "夜色沉下来，花草开始发光。寒露铃能拖住夜霉的脚步，刺刺薯则把自己藏进土里，等待一个不太走运的客人。",
        goals: ["守住 4 波夜霉", "使用寒露铃减速", "试试刺刺薯的埋伏"]
      },
      waves: [
        {
          name: "第 1 波",
          kicker: "WAVE 01",
          title: "萤火微光",
          groups: [
            { type: "mutterling", count: 5, gap: 2.2, start: 0 },
            { type: "zippy", count: 2, gap: 3, start: 2.1 }
          ]
        },
        {
          name: "第 2 波",
          kicker: "WAVE 02",
          title: "装箱出发",
          groups: [
            { type: "crateling", count: 4, gap: 3.2, start: 0 },
            { type: "mutterling", count: 5, gap: 2.2, start: 1.3 }
          ]
        },
        {
          name: "第 3 波",
          kicker: "WAVE 03",
          title: "铁罐与疾风",
          groups: [
            { type: "canhead", count: 2, gap: 5, start: 0 },
            { type: "zippy", count: 4, gap: 2.6, start: 1.2 },
            { type: "crateling", count: 3, gap: 3.2, start: 2.4 }
          ]
        },
        {
          name: "第 4 波",
          kicker: "FINAL WAVE",
          title: "摇旗的夜里",
          groups: [
            { type: "herald", count: 1, gap: 0, start: 0 },
            { type: "mutterling", count: 6, gap: 1.8, start: 0.8 },
            { type: "crateling", count: 4, gap: 2.9, start: 1.6 },
            { type: "canhead", count: 2, gap: 4.1, start: 3 }
          ]
        }
      ],
      completion: "萤火聚在叶片上，像给花园补上了一层温柔的灯。",
      tips: {
        start: "寒露铃与刺刺薯已经加入种子卡。减速、埋伏，再输出。",
        firstWave: "铁罐客很硬。用寒露铃拖住它，让后排多射几轮。"
      }
    },
    {
      id: 3,
      code: "03",
      name: "月蚀温室",
      en: "ECLIPSE HOUSE",
      theme: "eclipse",
      difficulty: 3,
      desc: "月蚀正在吞掉最后一缕光。温室深处，有什么东西醒了。",
      startSun: 175,
      firstWaveDelay: 22,
      betweenWaves: 10,
      skySunInterval: [7.5, 10.5],
      hpMul: 1.18,
      speedMul: 1.04,
      loadout: ["sunbud", "peapod", "frostbell", "nutshell", "thornspud", "popberry", "twinpod", "dandelion"],
      unlock: ["twinpod", "dandelion"],
      intro: {
        kicker: "月蚀温室 · 第 3 关",
        title: "把最后一缕光留下",
        lore: "月亮被咬掉了一口。温室玻璃外，夜霉团的王——月蚀吞噬者——正把影子挤进篱笆。双生豆荚和绒绒炮会来帮你。这是最后一座花园。",
        goals: ["守住 4 波夜霉", "击退月蚀吞噬者", "让月蚀后的太阳升起来"]
      },
      waves: [
        {
          name: "第 1 波",
          kicker: "WAVE 01",
          title: "影子入圃",
          groups: [
            { type: "crateling", count: 4, gap: 3, start: 0 },
            { type: "zippy", count: 3, gap: 2.8, start: 1.4 }
          ]
        },
        {
          name: "第 2 波",
          kicker: "WAVE 02",
          title: "铁罐齐步走",
          groups: [
            { type: "canhead", count: 3, gap: 4.5, start: 0 },
            { type: "mutterling", count: 6, gap: 1.9, start: 1.2 }
          ]
        },
        {
          name: "第 3 波",
          kicker: "WAVE 03",
          title: "月光缺口",
          groups: [
            { type: "herald", count: 1, gap: 0, start: 0 },
            { type: "crateling", count: 5, gap: 2.6, start: 0.5 },
            { type: "zippy", count: 4, gap: 2.3, start: 1.5 },
            { type: "canhead", count: 2, gap: 4, start: 2.2 }
          ]
        },
        {
          name: "第 4 波",
          kicker: "FINAL WAVE",
          title: "月蚀吞噬者",
          boss: true,
          groups: [
            { type: "mutterling", count: 6, gap: 2.5, start: 0 },
            { type: "zippy", count: 3, gap: 2.7, start: 1.2 },
            { type: "boss", count: 1, gap: 0, start: 2.2 }
          ]
        }
      ],
      completion: "月蚀退去。第一束晨光穿过温室玻璃，落在新长出的芽尖上。",
      tips: {
        start: "双生豆荚与绒绒炮加入种子卡。绒绒炮能跨行支援，记得用它补漏。",
        boss: "月蚀吞噬者来了！把火力集中在它所在的行，割草机只能替它挠一下痒。"
      }
    },
    {
      id: 4,
      code: "04",
      name: "雨铃花廊",
      en: "RAINBELL CORRIDOR",
      theme: "rain",
      difficulty: 2,
      desc: "月蚀退去后的第二天，雨没有停。旧钟楼在没有人的时候响了一声。",
      startSun: 175,
      firstWaveDelay: 22,
      betweenWaves: 9.5,
      skySunInterval: [8, 11.5],
      hpMul: 1.22,
      speedMul: 1.05,
      loadout: ["sunbud", "peapod", "frostbell", "nutshell", "thornspud", "twinpod", "ripplily", "popberry"],
      unlock: ["ripplily"],
      intro: {
        kicker: "雨铃花廊 · 第 4 关",
        title: "让雨声也变成守卫",
        lore: "雨水顺着钟楼的旧水渠流进花廊。被冲开的泥层里，苔甲卫跟着一群夜霉摸进来。涟漪莲会把水花溅到相邻两行，正好对付挤在廊下的队伍。",
        goals: ["守住 4 波夜霉", "解锁涟漪莲", "保护雨中的花廊"]
      },
      waves: [
        {
          name: "第 1 波",
          kicker: "WAVE 01",
          title: "雨里的脚步",
          groups: [
            { type: "mutterling", count: 5, gap: 2.1, start: 0 },
            { type: "zippy", count: 2, gap: 3.1, start: 2.1 }
          ]
        },
        {
          name: "第 2 波",
          kicker: "WAVE 02",
          title: "苔甲进水",
          groups: [
            { type: "crateling", count: 4, gap: 2.8, start: 0 },
            { type: "mossguard", count: 1, gap: 0, start: 2.2 },
            { type: "mutterling", count: 4, gap: 2.2, start: 1.1 }
          ]
        },
        {
          name: "第 3 波",
          kicker: "WAVE 03",
          title: "铁罐与水花",
          groups: [
            { type: "canhead", count: 2, gap: 4.4, start: 0 },
            { type: "zippy", count: 4, gap: 2.4, start: 1.3 },
            { type: "mossguard", count: 2, gap: 3.8, start: 2.4 }
          ]
        },
        {
          name: "第 4 波",
          kicker: "FINAL WAVE",
          title: "花廊尽头",
          groups: [
            { type: "herald", count: 1, gap: 0, start: 0 },
            { type: "crateling", count: 4, gap: 2.5, start: 0.8 },
            { type: "canhead", count: 2, gap: 3.8, start: 2.1 },
            { type: "mossguard", count: 2, gap: 3.2, start: 3.3 },
            { type: "zippy", count: 3, gap: 2.4, start: 2.7 }
          ]
        }
      ],
      completion: "雨停了。花廊尽头的那口旧钟轻轻回响，像在把什么东西往下压。",
      tips: {
        start: "涟漪莲的水珠会溅到相邻两行，种在夜霉最密的那一行旁边。",
        firstPlant: "雨声里也要先攒阳光。别让前排的苔甲卫把整条花廊都占了。"
      }
    },
    {
      id: 5,
      code: "05",
      name: "星屑水渠",
      en: "STARFALL CHANNEL",
      theme: "starlit",
      difficulty: 3,
      desc: "水面浮着星星。棱镜花把星光折成一束，能照穿一整行夜霉。",
      startSun: 200,
      firstWaveDelay: 21,
      betweenWaves: 9.5,
      skySunInterval: [7.5, 11],
      hpMul: 1.3,
      speedMul: 1.07,
      loadout: ["sunbud", "peapod", "frostbell", "nutshell", "ripplily", "prismbloom", "twinpod", "popberry"],
      unlock: ["prismbloom"],
      intro: {
        kicker: "星屑水渠 · 第 5 关",
        title: "把星光折成一束",
        lore: "水渠倒映着一片不该在深夜出现的星空。棱镜花能从星光里取出一束光，贯穿整行。苔甲卫正在下游筑起石墙，水声越来越近了。",
        goals: ["守住 4 波夜霉", "解锁棱镜花", "让水渠重新流动"]
      },
      waves: [
        {
          name: "第 1 波",
          kicker: "WAVE 01",
          title: "星光滑落",
          groups: [
            { type: "zippy", count: 4, gap: 2.5, start: 0 },
            { type: "crateling", count: 4, gap: 2.7, start: 1.1 }
          ]
        },
        {
          name: "第 2 波",
          kicker: "WAVE 02",
          title: "石墙移动",
          groups: [
            { type: "mossguard", count: 3, gap: 4, start: 0 },
            { type: "mutterling", count: 5, gap: 2.1, start: 1.4 }
          ]
        },
        {
          name: "第 3 波",
          kicker: "WAVE 03",
          title: "水渠翻涌",
          groups: [
            { type: "canhead", count: 3, gap: 3.8, start: 0 },
            { type: "zippy", count: 4, gap: 2.3, start: 1.2 },
            { type: "herald", count: 1, gap: 0, start: 2.8 }
          ]
        },
        {
          name: "第 4 波",
          kicker: "FINAL WAVE",
          title: "星落之前",
          groups: [
            { type: "canhead", count: 3, gap: 3.2, start: 0 },
            { type: "mossguard", count: 3, gap: 3.4, start: 1.4 },
            { type: "crateling", count: 4, gap: 2.6, start: 0.8 },
            { type: "zippy", count: 4, gap: 2.2, start: 2 }
          ]
        }
      ],
      completion: "星光顺着水流回来。水渠尽头，钟楼的轮廓在雾里亮起。",
      tips: {
        start: "棱镜花的光束会穿过整行。把它种在夜霉最多的一行，能一次照到一群。",
        firstWave: "苔甲卫很硬。先用寒露铃和坚果墩拖住它，再让棱镜花照满整行。"
      }
    },
    {
      id: 6,
      code: "06",
      name: "破晓钟楼",
      en: "DAWN BELFRY",
      theme: "dawn",
      difficulty: 3,
      desc: "钟楼把整座花园的清晨都吞进了钟腹。永夜钟守正在等待最后一次鸣响。",
      startSun: 250,
      firstWaveDelay: 21,
      betweenWaves: 10,
      skySunInterval: [7, 10.5],
      hpMul: 1.32,
      speedMul: 1.08,
      loadout: ["sunbud", "peapod", "frostbell", "nutshell", "twinpod", "prismbloom", "dawnbell", "popberry"],
      unlock: ["dawnbell"],
      intro: {
        kicker: "破晓钟楼 · 第 6 关",
        title: "最后一响，留给清晨",
        lore: "雨声和星光都被吸进了钟楼。永夜钟守把整夜披在身上，只要有钟声，它就能继续把清晨按在钟腹里。破晓钟会回应它——一下、两下，把光从钟壁里震出来。",
        goals: ["守住 4 波夜霉", "解锁破晓钟", "击退永夜钟守"]
      },
      waves: [
        {
          name: "第 1 波",
          kicker: "WAVE 01",
          title: "钟楼醒着",
          groups: [
            { type: "crateling", count: 5, gap: 2.6, start: 0 },
            { type: "zippy", count: 3, gap: 2.5, start: 1.4 }
          ]
        },
        {
          name: "第 2 波",
          kicker: "WAVE 02",
          title: "石头进门",
          groups: [
            { type: "mossguard", count: 3, gap: 3.8, start: 0 },
            { type: "canhead", count: 2, gap: 4.2, start: 1.1 },
            { type: "mutterling", count: 4, gap: 2.2, start: 1.8 }
          ]
        },
        {
          name: "第 3 波",
          kicker: "WAVE 03",
          title: "夜半钟声",
          groups: [
            { type: "herald", count: 1, gap: 0, start: 0 },
            { type: "canhead", count: 3, gap: 3.3, start: 0.7 },
            { type: "mossguard", count: 2, gap: 3.6, start: 1.7 },
            { type: "zippy", count: 4, gap: 2.2, start: 2.4 },
            { type: "crateling", count: 2, gap: 3, start: 2.8 }
          ]
        },
        {
          name: "第 4 波",
          kicker: "FINAL WAVE",
          title: "永夜钟守",
          boss: true,
          groups: [
            { type: "mutterling", count: 6, gap: 2.4, start: 0 },
            { type: "zippy", count: 3, gap: 2.6, start: 1.2 },
            { type: "mossguard", count: 1, gap: 0, start: 2.1 },
            { type: "canhead", count: 1, gap: 0, start: 2.9 },
            { type: "bellwarden", count: 1, gap: 0, start: 3.4 }
          ]
        }
      ],
      completion: "钟声停了。太阳从钟楼背后升起来，整座花园都听见了清晨。",
      tips: {
        start: "破晓钟的钟波同时撼动三行。先稳住中路，让它在钟楼前响起来。",
        boss: "永夜钟守醒了。它藏身在中路的钟影里——集中三行火力，别让钟声再响一次。"
      }
    }
  ];

  const howSteps = [
    { n: "01", title: "收集阳光", text: "点击落下的阳光。向日芽也会定期产出。阳光是唯一的货币。" },
    { n: "02", title: "种下光芽", text: "点种子卡，再点草坪。每格一株，每张卡都有价格和冷却。" },
    { n: "03", title: "挡住夜霉", text: "输出、减速、拦截。突破防线时，割草机会替你争取最后一线。" }
  ];

  function plantListFor(level) {
    return level.loadout.map(function (id) { return plants[id]; });
  }

  Sunbud.DATA = {
    plants: plants,
    enemies: enemies,
    levels: levels,
    howSteps: howSteps,
    plantListFor: plantListFor,
    getLevel: function (id) {
      return levels.find(function (level) { return level.id === Number(id); }) || null;
    }
  };
})(window);
