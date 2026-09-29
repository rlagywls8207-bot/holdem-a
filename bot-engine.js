/* ==========================================================
   HOLDEM A BOT ENGINE
   v0.15.0

   역할
   - 봇의 행동만 결정한다.
   - 실제 베팅/폴드/콜 처리는 기존 서버 엔진이 담당한다.
   - 서버의 숨겨진 정보는 사용하지 않는다.
========================================================== */

const HoldemBotEngine = (() => {

  const PROFILE = {
    HONEST: "honest",
    MOTH: "moth",
    MASTER: "master"
  };


  /* ==========================================================
     기본 유틸
  ========================================================== */

  function num(value) {

    const n = Number(value);

    return Number.isFinite(n)
      ? n
      : 0;

  }


  function int(value) {

    return Math.floor(
      num(value)
    );

  }


  function clamp(
    value,
    min,
    max
  ) {

    return Math.max(
      min,
      Math.min(
        value,
        max
      )
    );

  }


  function randomBetween(
    min,
    max
  ) {

    return min +
      Math.random() *
      (max - min);

  }


  function randomInt(
    min,
    max
  ) {

    return Math.floor(
      randomBetween(
        min,
        max + 1
      )
    );

  }


  function chance(
    probability
  ) {

    return Math.random() <
      clamp(
        probability,
        0,
        1
      );

  }


  function pick(
    items
  ) {

    if(
      !items ||
      items.length === 0
    ) {

      return null;

    }


    return items[
      randomInt(
        0,
        items.length - 1
      )
    ];

  }


  /* ==========================================================
     카드 정규화
  ========================================================== */

  const RANK_VALUE = {

    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,

    T: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14

  };


  function normalizeRank(
    card
  ) {

    if(!card) {

      return 0;

    }


    const raw =
      String(
        card.rank_text ??
        card.rank ??
        ""
      )
      .toUpperCase();


    return RANK_VALUE[raw] ?? 0;

  }


  function normalizeSuit(
    card
  ) {

    if(!card) {

      return "";

    }


    const raw =
      String(
        card.suit ??
        ""
      )
      .toLowerCase();


    const map = {

      h: "hearts",
      hearts: "hearts",

      d: "diamonds",
      diamonds: "diamonds",

      c: "clubs",
      clubs: "clubs",

      s: "spades",
      spades: "spades"

    };


    return map[raw] ?? raw;

  }


  function normalizeCard(
    card
  ) {

    return {

      rank:
      normalizeRank(
        card
      ),

      suit:
      normalizeSuit(
        card
      )

    };

  }


  /* ==========================================================
     5장 족보 평가

     category
     8 = 스트레이트 플러시
     7 = 포카드
     6 = 풀하우스
     5 = 플러시
     4 = 스트레이트
     3 = 트리플
     2 = 투페어
     1 = 원페어
     0 = 하이카드
  ========================================================== */

  function evaluateFive(
    cards
  ) {

    const ranks =
      cards
      .map(
        card =>
        card.rank
      )
      .sort(
        (a,b) =>
        b - a
      );


    const suits =
      cards
      .map(
        card =>
        card.suit
      );


    const counts =
      {};


    ranks.forEach(
      rank => {

        counts[rank] =
          (counts[rank] ?? 0) + 1;

      }
    );


    const uniqueRanks =
      [...new Set(ranks)];


    if(
      uniqueRanks.includes(14)
    ) {

      uniqueRanks.push(1);

    }


    uniqueRanks.sort(
      (a,b) =>
      b - a
    );


    let straightHigh =
      0;


    for(
      let i = 0;
      i <=
      uniqueRanks.length - 5;
      i++
    ) {

      const slice =
        uniqueRanks.slice(
          i,
          i + 5
        );


      let consecutive =
        true;


      for(
        let j = 1;
        j < 5;
        j++
      ) {

        if(
          slice[j] !==
          slice[0] - j
        ) {

          consecutive =
            false;

          break;

        }

      }


      if(consecutive) {

        straightHigh =
          slice[0];

        break;

      }

    }


    const flush =
      suits.every(
        suit =>
        suit === suits[0]
      );


    const groups =
      Object.entries(
        counts
      )
      .map(
        ([rank,count]) => ({
          rank:
          Number(rank),

          count
        })
      )
      .sort(
        (a,b) => {

          if(
            b.count !==
            a.count
          ) {

            return b.count -
              a.count;

          }


          return b.rank -
            a.rank;

        }
      );


    if(
      flush &&
      straightHigh
    ) {

      return {
        category: 8,
        values: [
          straightHigh
        ]
      };

    }


    if(
      groups[0]?.count ===
      4
    ) {

      return {

        category: 7,

        values: [
          groups[0].rank,
          groups[1]?.rank ?? 0
        ]

      };

    }


    if(
      groups[0]?.count === 3 &&
      groups[1]?.count === 2
    ) {

      return {

        category: 6,

        values: [
          groups[0].rank,
          groups[1].rank
        ]

      };

    }


    if(flush) {

      return {

        category: 5,

        values:
        ranks

      };

    }


    if(straightHigh) {

      return {

        category: 4,

        values: [
          straightHigh
        ]

      };

    }


    if(
      groups[0]?.count ===
      3
    ) {

      const kickers =
        groups
        .filter(
          g =>
          g.count === 1
        )
        .map(
          g =>
          g.rank
        )
        .sort(
          (a,b) =>
          b - a
        );


      return {

        category: 3,

        values: [
          groups[0].rank,
          ...kickers
        ]

      };

    }


    const pairs =
      groups
      .filter(
        g =>
        g.count === 2
      )
      .sort(
        (a,b) =>
        b.rank - a.rank
      );


    if(
      pairs.length >= 2
    ) {

      const kicker =
        groups
        .filter(
          g =>
          g.count === 1
        )
        .map(
          g =>
          g.rank
        )
        .sort(
          (a,b) =>
          b - a
        )[0] ?? 0;


      return {

        category: 2,

        values: [
          pairs[0].rank,
          pairs[1].rank,
          kicker
        ]

      };

    }


    if(
      pairs.length === 1
    ) {

      const kickers =
        groups
        .filter(
          g =>
          g.count === 1
        )
        .map(
          g =>
          g.rank
        )
        .sort(
          (a,b) =>
          b - a
        );


      return {

        category: 1,

        values: [
          pairs[0].rank,
          ...kickers
        ]

      };

    }


    return {

      category: 0,

      values:
      ranks

    };

  }


  function compareHandScore(
    a,
    b
  ) {

    if(
      a.category !==
      b.category
    ) {

      return a.category -
        b.category;

    }


    const length =
      Math.max(
        a.values.length,
        b.values.length
      );


    for(
      let i = 0;
      i < length;
      i++
    ) {

      const av =
        a.values[i] ?? 0;

      const bv =
        b.values[i] ?? 0;


      if(av !== bv) {

        return av - bv;

      }

    }


    return 0;

  }


  function combinations(
    cards,
    choose
  ) {

    const result =
      [];


    function walk(
      start,
      picked
    ) {

      if(
        picked.length ===
        choose
      ) {

        result.push(
          picked.slice()
        );

        return;

      }


      for(
        let i = start;
        i < cards.length;
        i++
      ) {

        picked.push(
          cards[i]
        );

        walk(
          i + 1,
          picked
        );

        picked.pop();

      }

    }


    walk(
      0,
      []
    );


    return result;

  }


  function evaluateBest(
    cards
  ) {

    if(
      cards.length < 5
    ) {

      return {

        category: -1,
        values: []

      };

    }


    let best =
      null;


    const combos =
      combinations(
        cards,
        5
      );


    combos.forEach(
      combo => {

        const score =
          evaluateFive(
            combo
          );


        if(
          !best ||
          compareHandScore(
            score,
            best
          ) > 0
        ) {

          best =
            score;

        }

      }
    );


    return best;

  }


  /* ==========================================================
     프리플랍 시작 패 점수

     0 ~ 1 정도의 값
  ========================================================== */

  function preflopStrength(
    holeCards
  ) {

    if(
      !holeCards ||
      holeCards.length < 2
    ) {

      return 0.2;

    }


    const cards =
      holeCards
      .slice(
        0,
        2
      )
      .map(
        normalizeCard
      );


    const a =
      Math.max(
        cards[0].rank,
        cards[1].rank
      );


    const b =
      Math.min(
        cards[0].rank,
        cards[1].rank
      );


    const pair =
      a === b;


    const suited =
      cards[0].suit &&
      cards[0].suit ===
      cards[1].suit;


    const gap =
      Math.abs(
        a - b
      );


    let score =
      0.12;


    score +=
      (a - 2) /
      12 *
      0.36;


    score +=
      (b - 2) /
      12 *
      0.18;


    if(pair) {

      score +=
        0.28 +
        (
          (a - 2) /
          12 *
          0.12
        );

    }


    if(suited) {

      score +=
        0.06;

    }


    if(gap === 1) {

      score +=
        0.05;

    } else if(
      gap === 2
    ) {

      score +=
        0.025;

    } else if(
      gap >= 5
    ) {

      score -=
        0.06;

    }


    if(
      a === 14 &&
      b >= 10
    ) {

      score +=
        0.08;

    }


    return clamp(
      score,
      0.05,
      0.99
    );

  }


  /* ==========================================================
     전체 덱
  ========================================================== */

  function createDeck() {

    const deck =
      [];


    const suits = [
      "hearts",
      "diamonds",
      "clubs",
      "spades"
    ];


    suits.forEach(
      suit => {

        for(
          let rank = 2;
          rank <= 14;
          rank++
        ) {

          deck.push({
            rank,
            suit
          });

        }

      }
    );


    return deck;

  }


  function cardKey(
    card
  ) {

    return `${card.rank}_${card.suit}`;

  }


  function shuffled(
    items
  ) {

    const arr =
      items.slice();


    for(
      let i =
      arr.length - 1;
      i > 0;
      i--
    ) {

      const j =
        randomInt(
          0,
          i
        );


      const temp =
        arr[i];

      arr[i] =
        arr[j];

      arr[j] =
        temp;

    }


    return arr;

  }


  /* ==========================================================
     Monte Carlo 승률 추정
  ========================================================== */

  function estimateEquity({

    holeCards,
    communityCards,
    opponentCount,
    iterations

  }) {

    const heroHole =
      (holeCards ?? [])
      .map(
        normalizeCard
      );


    const board =
      (communityCards ?? [])
      .map(
        normalizeCard
      );


    if(
      heroHole.length < 2
    ) {

      return 0.5;

    }


    const knownKeys =
      new Set(
        [
          ...heroHole,
          ...board
        ]
        .map(
          cardKey
        )
      );


    const deck =
      createDeck()
      .filter(
        card =>
        !knownKeys.has(
          cardKey(
            card
          )
        )
      );


    const opponents =
      Math.max(
        1,
        int(
          opponentCount
        )
      );


    const runs =
      Math.max(
        50,
        int(
          iterations
        )
      );


    let totalShare =
      0;


    for(
      let i = 0;
      i < runs;
      i++
    ) {

      const available =
        shuffled(
          deck
        );


      let pointer =
        0;


      const opponentHoles =
        [];


      for(
        let o = 0;
        o < opponents;
        o++
      ) {

        opponentHoles.push([
          available[pointer++],
          available[pointer++]
        ]);

      }


      const boardNeeded =
        5 -
        board.length;


      const simulatedBoard =
        board.slice();


      for(
        let b = 0;
        b < boardNeeded;
        b++
      ) {

        simulatedBoard.push(
          available[pointer++]
        );

      }


      const heroScore =
        evaluateBest([
          ...heroHole,
          ...simulatedBoard
        ]);


      const opponentScores =
        opponentHoles
        .map(
          hole =>
          evaluateBest([
            ...hole,
            ...simulatedBoard
          ])
        );


      let betterCount =
        0;

      let equalCount =
        0;


      opponentScores.forEach(
        score => {

          const cmp =
            compareHandScore(
              heroScore,
              score
            );


          if(cmp < 0) {

            betterCount++;

          } else if(
            cmp === 0
          ) {

            equalCount++;

          }

        }
      );


      if(
        betterCount === 0
      ) {

        totalShare +=
          1 /
          (equalCount + 1);

      }

    }


    return clamp(
      totalShare /
      runs,
      0,
      1
    );

  }


  /* ==========================================================
     현재 상대 수
  ========================================================== */

  function getOpponentCount(
    players,
    botId
  ) {

    const active =
      (players ?? [])
      .filter(
        player =>
        !player.folded
      );


    const count =
      active.filter(
        player => {

          if(
            botId &&
            (
              player.profile_id === botId ||
              player.bot_instance_id === botId
            )
          ) {

            return false;

          }


          return true;

        }
      )
      .length;


    return Math.max(
      1,
      count
    );

  }


  /* ==========================================================
     팟 오즈
  ========================================================== */

  function getPotOdds(
    pot,
    callAmount
  ) {

    const call =
      Math.max(
        0,
        num(
          callAmount
        )
      );


    if(call <= 0) {

      return 0;

    }


    const finalPot =
      Math.max(
        0,
        num(
          pot
        )
      ) +
      call;


    if(finalPot <= 0) {

      return 0;

    }


    return call /
      finalPot;

  }

  /* ==========================================================
     레이즈 금액
  ========================================================== */

  function chooseRaiseTarget({

    options,
    intensity = 0.5,
    chaos = 0

  }) {

    const min =
      num(
        options?.min_raise_to
      );

    const max =
      num(
        options?.max_raise_to
      );

    if(
      max <= 0 ||
      max < min
    ) {

      return null;

    }


    /*
      일반 레이즈는 최소 레이즈를 기준으로 계산한다.

      기존:
      최소~최대 레이즈 가능 금액의 일정 비율

      변경:
      최소 레이즈에서 남은 범위의 일부만 사용

      intensity는 기존 봇의 공격성 구분에 사용한다.
    */

    const ratio =
      clamp(
        intensity,
        0,
        1
      );


    /*
      일반적인 베팅에서는
      전체 레이즈 가능 범위의 최대 15%만 사용한다.
    */

    const normalRatio =
      ratio * 0.15;


    /*
      희귀한 폭주 행동.

      기존 chaos 확률을 그대로 적용하면
      일부 봇이 너무 자주 큰 금액을 선택할 수 있으므로
      최대 0.5%로 제한한다.
    */

    if(
      chance(
        Math.min(
          Math.max(
            0,
            chaos
          ),
          0.005
        )
      )
    ) {

      return randomInt(
        int(min),
        int(max)
      );

    }


    const target =
      min +
      (
        max - min
      ) *
      normalRatio;


    return clamp(
      Math.round(
        target
      ),
      int(min),
      int(max)
    );

  }


  /* ==========================================================
     가능한 행동 보정
  ========================================================== */

  function sanitizeDecision(
    decision,
    options
  ) {

    const o =
      options ?? {};


    if(
      !decision
    ) {

      decision = {
        action: null
      };

    }


    if(
      decision.action ===
      "raise" &&
      !o.can_raise
    ) {

      if(o.can_call) {

        decision = {
          action: "call"
        };

      } else if(
        o.can_check
      ) {

        decision = {
          action: "check"
        };

      } else {

        decision = {
          action: "fold"
        };

      }

    }


    if(
      decision.action ===
      "call" &&
      !o.can_call
    ) {

      if(o.can_check) {

        decision = {
          action: "check"
        };

      } else {

        decision = {
          action: "fold"
        };

      }

    }


    if(
      decision.action ===
      "check" &&
      !o.can_check
    ) {

      if(o.can_call) {

        decision = {
          action: "call"
        };

      } else {

        decision = {
          action: "fold"
        };

      }

    }


    if(
      decision.action ===
      "fold" &&
      !o.can_fold
    ) {

      if(o.can_check) {

        decision = {
          action: "check"
        };

      } else if(
        o.can_call
      ) {

        decision = {
          action: "call"
        };

      }

    }


    if(
      decision.action ===
      "raise"
    ) {

      const minRaise =
        Number(
          o.min_raise_to
        );

      const maxRaise =
        Number(
          o.max_raise_to
        );

      const requestedRaise =
        Number(
          decision.raiseTo
        );

      if(
        !o.can_raise ||
        !Number.isFinite(minRaise) ||
        !Number.isFinite(maxRaise) ||
        minRaise <= 0 ||
        maxRaise < minRaise
      ) {

        if(o.can_check) {

          decision = {
            action: "check"
          };

        } else if(o.can_call) {

          decision = {
            action: "call"
          };

        } else {

          decision = {
            action: "fold"
          };

        }

      } else {

        decision.raiseTo =
          clamp(
            Number.isFinite(requestedRaise)
              ? Math.floor(requestedRaise)
              : Math.ceil(minRaise),
            Math.ceil(minRaise),
            Math.floor(maxRaise)
          );

      }

    }

    if(
      decision.action !==
      "raise"
    ) {

      decision.raiseTo =
        null;

    
    }


    return decision;

  }


  /* ==========================================================
     정직한 캐릭터

     약함 -> 폴드
     애매함 -> 체크/콜
     강함 -> 베팅
     매우 강함 -> 큰 베팅

     블러핑 거의 없음
  ========================================================== */

  function decideHonest(
    context
  ) {

    const {

      equity,
      options,
      potOdds

    } =
    context;


    const o =
      options;


    const call =
      num(
        o.call_amount
      );


    if(
      call > 0 &&
      equity <
      Math.max(
        0.32,
        potOdds + 0.07
      )
    ) {

      return {
        action: "fold"
      };

    }


    if(
      equity < 0.43
    ) {

      if(o.can_check) {

        return {
          action: "check"
        };

      }


      if(
        o.can_call &&
        call <=
        Math.max(
          1,
          num(
            o.my_chips
          ) *
          0.08
        )
      ) {

        return {
          action: "call"
        };

      }


      return {
        action: "fold"
      };

    }


    if(
      equity < 0.64
    ) {

      if(
        o.can_call &&
        call > 0
      ) {

        return {
          action: "call"
        };

      }


      if(o.can_check) {

        return {
          action: "check"
        };

      }

    }


    if(
      equity >= 0.64 &&
      o.can_raise
    ) {

      const intensity =
        equity >= 0.84
        ? randomBetween(
            0.68,
            0.95
          )
        : randomBetween(
            0.20,
            0.48
          );


      if(
        equity >= 0.76 ||
        chance(0.62)
      ) {

        return {

          action: "raise",

          raiseTo:
          chooseRaiseTarget({

            options: o,
            intensity,
            chaos: 0.03

          })

        };

      }

    }


    if(
      o.can_call &&
      call > 0
    ) {

      return {
        action: "call"
      };

    }


    if(o.can_check) {

      return {
        action: "check"
      };

    }


    return {
      action: "fold"
    };

  }


  /* ==========================================================
     불나방 캐릭터

     핵심
     - 좋은 패와 나쁜 패의 공격성을 고정적으로 연결하지 않음.
     - 매 핸드/턴마다 공격성 변동.
     - 쓰레기 패에서도 레이즈/올인 가능.
     - 좋은 패에서도 똑같은 난폭 행동 가능.
  ========================================================== */

   function decideMoth(
    context
  ) {

    const {

      equity,
      options,
      potOdds,
      street

    } =
    context;


    const o =
      options;


    const call =
      num(
        o.call_amount
      );


    const chips =
      Math.max(
        1,
        num(
          o.my_chips
        )
      );


    const max =
      num(
        o.max_raise_to
      );


    const callPressure =
      call /
      chips;


    /*
      ==========================================================
      BBB / 김효진

      설문 기반 성향

      - 처음부터 무조건 공격하지는 않음
      - 콜로 판에 들어가는 것을 좋아함
      - 상대가 압박하면 쉽게 물러서지 않음
      - 중간 이상 패에서는 재공격 성향이 강함
      - 약한 패에서도 블러프 레이즈 가능
      - 좋은 패도 가끔 콜/체크로 숨김
      - 가끔 예상보다 훨씬 큰 승부를 시작함
      - 위기에서는 무조건 난폭해지는 대신
        버티다가 특정 순간 크게 승부함
      ==========================================================
    */


    /*
      한 번의 행동에서 나타나는
      김효진 특유의 변동성.

      낮음  : 평소보다 조심
      보통  : 기본 성향
      높음  : 공격성 증가
      폭발  : 갑자기 큰 승부 가능
    */

    const mood =
      Math.random();


    const cautious =
      mood < 0.14;


    const aggressive =
      mood >= 0.68;


    const escalate =
      mood >= 0.88;


    /*
      현재 칩에서 콜 금액이 차지하는 비율이
      매우 크면 위기 상황으로 취급한다.

      단, 위기라고 자동 올인하지 않는다.
    */

    const danger =
      callPressure >= 0.45;


    /*
      ----------------------------------------------------------
      패 강도 구간

      기존 엔진의 equity 체계를 그대로 사용한다.
      ----------------------------------------------------------
    */

    let strength =
      0;


    if(
      equity >= 0.30
    ) {

      strength =
        1;

    }


    if(
      equity >= 0.43
    ) {

      strength =
        2;

    }


    if(
      equity >= 0.58
    ) {

      strength =
        3;

    }


    if(
      equity >= 0.75
    ) {

      strength =
        4;

    }


    /*
      ----------------------------------------------------------
      올인 / 최대 레이즈

      김효진은 기존 불나방처럼
      아무 이유 없이 자주 올인하지 않는다.

      대신 강한 패, 큰 압박,
      폭발 성향이 겹치면 갑자기
      최대 승부까지 갈 수 있다.
      ----------------------------------------------------------
    */

    let allInChance =
      0.001;


    if(
      strength === 1
    ) {

      allInChance =
        0.002;

    }


    if(
      strength === 2
    ) {

      allInChance =
        0.004;

    }


    if(
      strength === 3
    ) {

      allInChance =
        0.010;

    }


    if(
      strength === 4
    ) {

      allInChance =
        0.020;

    }


    /*
      플랍 이후에는
      승부가 진행된 만큼 큰 결정을
      조금 더 허용한다.
    */

    if(
      street !== "preflop"
    ) {

      allInChance *=
        1.35;

    }


    /*
      평소에는 위기에서 오히려
      칩을 조금 지키려 한다.
    */

    if(
      danger &&
      !escalate
    ) {

      allInChance *=
        0.70;

    }


    /*
      하지만 폭발 상태에서는
      위기 상황이 오히려 큰 승부의
      계기가 될 수 있다.
    */

    if(
      danger &&
      escalate
    ) {

      allInChance +=
        strength >= 2
        ? 0.055
        : 0.018;

    }


    /*
      좋은 패 + 폭발 상태에서는
      갑작스러운 대승부 가능.
    */

    if(
      escalate &&
      strength >= 3
    ) {

      allInChance +=
        0.035;

    }


    allInChance =
      clamp(
        allInChance,
        0,
        0.12
      );


    if(
      o.can_raise &&
      max > 0 &&
      chance(
        allInChance
      )
    ) {

      return {

        action: "raise",

        raiseTo:
        int(
          max
        )

      };

    }


    /*
      ----------------------------------------------------------
      일반 레이즈

      설문 핵심:
      콜러처럼 보이지만 수동적인 캐릭터가 아니다.

      약한 패에서도 공격 가능하고,
      중간 이상 패에서는 공격성이 빠르게 올라간다.
      ----------------------------------------------------------
    */

    let raiseChance;


    if(
      strength === 0
    ) {

      raiseChance =
        0.17;

    } else if(
      strength === 1
    ) {

      raiseChance =
        0.29;

    } else if(
      strength === 2
    ) {

      raiseChance =
        0.43;

    } else if(
      strength === 3
    ) {

      raiseChance =
        0.55;

    } else {

      /*
        최상급 패도 무조건 레이즈하지 않는다.
        일부는 콜/체크로 숨긴다.
      */

      raiseChance =
        0.58;

    }


    /*
      플랍 이후에는
      프리플랍보다 조금 더 공격적.
    */

    if(
      street !== "preflop"
    ) {

      raiseChance +=
        0.05;

    }


    /*
      조심스러운 순간.
    */

    if(
      cautious
    ) {

      raiseChance -=
        0.12;

    }


    /*
      공격적인 순간.
    */

    if(
      aggressive
    ) {

      raiseChance +=
        0.09;

    }


    /*
      김효진 특유의 갑작스러운 폭발.

      약한 패에서도 적용되므로
      블러프 레이즈가 가능하다.
    */

    if(
      escalate
    ) {

      raiseChance +=
        0.17;

    }


    /*
      상대가 큰 금액을 요구한다고
      바로 움츠러들지는 않는다.

      보통 이상의 패에서는
      오히려 맞받아칠 가능성을 높인다.
    */

    if(
      call > 0 &&
      callPressure >= 0.18 &&
      strength >= 2
    ) {

      raiseChance +=
        0.08;

    }


    if(
      call > 0 &&
      callPressure >= 0.35 &&
      strength >= 2
    ) {

      raiseChance +=
        0.07;

    }


    /*
      단, 약한 패 + 큰 압박 + 평상시에는
      무조건 싸우지는 않는다.
    */

    if(
      danger &&
      strength <= 1 &&
      !escalate
    ) {

      raiseChance -=
        0.14;

    }


    raiseChance =
      clamp(
        raiseChance,
        0.05,
        0.82
      );


    if(
      o.can_raise &&
      chance(
        raiseChance
      )
    ) {

      /*
        베팅 크기도 일정하지 않게 한다.

        기본적으로 중간~큰 레이즈를 선호하고,
        폭발 상태에서는 훨씬 크게 갈 수 있다.
      */

      let minIntensity =
        0.20;


      let maxIntensity =
        0.62;


      if(
        strength >= 2
      ) {

        minIntensity =
          0.28;

        maxIntensity =
          0.74;

      }


      if(
        strength >= 3
      ) {

        minIntensity =
          0.34;

        maxIntensity =
          0.86;

      }


      if(
        escalate
      ) {

        minIntensity =
          Math.max(
            minIntensity,
            0.48
          );

        maxIntensity =
          0.96;

      }


      /*
        약한 패의 블러프에서도
        가끔 크게 밀어붙인다.
      */

      if(
        strength <= 1 &&
        escalate
      ) {

        minIntensity =
          0.40;

        maxIntensity =
          0.88;

      }


      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          randomBetween(
            minIntensity,
            maxIntensity
          ),

          chaos:
          escalate
          ? 0.58
          : 0.40

        })

      };

    }


    /*
      ----------------------------------------------------------
      콜 / 폴드

      김효진은 판에 남는 성향이 강하다.
      하지만 아무 금액이나 무조건 콜하지는 않는다.
      ----------------------------------------------------------
    */

    if(
      call > 0 &&
      o.can_call
    ) {

      let callChance;


      if(
        strength === 0
      ) {

        callChance =
          0.55;

      } else if(
        strength === 1
      ) {

        callChance =
          0.63;

      } else if(
        strength === 2
      ) {

        callChance =
          0.72;

      } else if(
        strength === 3
      ) {

        callChance =
          0.82;

      } else {

        /*
          매우 강한 패도 일부는
          콜로 숨길 수 있다.
        */

        callChance =
          0.88;

      }


      /*
        상대 압박에 대한 저항이 높다.

        기존 BBB보다 큰 베팅에 의한
        콜 확률 감소를 완화한다.
      */

      callChance -=
        callPressure *
        0.27;


      /*
        팟 오즈도 완전히 무시하지는 않는다.
      */

      callChance -=
        potOdds *
        0.04;


      /*
        조심스러운 순간에는
        약한 패를 조금 더 버린다.
      */

      if(
        cautious &&
        strength <= 1
      ) {

        callChance -=
          0.10;

      }


      /*
        공격 모드인데 레이즈 판정에서
        레이즈하지 않았다면,
        그래도 쉽게 포기하지 않는다.
      */

      if(
        aggressive
      ) {

        callChance +=
          0.05;

      }


      /*
        위기 상황.

        약한 패는 오히려 보호적으로,
        보통 이상이면 끝까지 맞설 수 있다.
      */

      if(
        danger
      ) {

        if(
          strength <= 1
        ) {

          callChance -=
            escalate
            ? 0.02
            : 0.15;

        } else {

          callChance +=
            0.06;

        }

      }


      callChance =
        clamp(
          callChance,
          0.10,
          0.94
        );


      if(
        chance(
          callChance
        )
      ) {

        return {
          action: "call"
        };

      }


      if(o.can_fold) {

        return {
          action: "fold"
        };

      }

    }


    /*
      ----------------------------------------------------------
      체크 가능한 상황

      공짜 카드라고 무조건 체크하지 않는다.

      약한 패 블러프와
      강한 패 공격 모두 가능하다.
      ----------------------------------------------------------
    */

    if(
      o.can_raise
    ) {

      let probeChance =
        0.13;


      if(
        strength >= 2
      ) {

        probeChance =
          0.24;

      }


      if(
        strength >= 3
      ) {

        probeChance =
          0.34;

      }


      if(
        escalate
      ) {

        probeChance +=
          0.18;

      }


      if(
        cautious
      ) {

        probeChance -=
          0.08;

      }


      if(
        chance(
          clamp(
            probeChance,
            0.04,
            0.60
          )
        )
      ) {

        return {

          action: "raise",

          raiseTo:
          chooseRaiseTarget({

            options: o,

            intensity:
            randomBetween(

              escalate
              ? 0.42
              : 0.18,

              escalate
              ? 0.88
              : 0.58

            ),

            chaos:
            escalate
            ? 0.55
            : 0.35

          })

        };

      }

    }


    if(o.can_check) {

      return {
        action: "check"
      };

    }


    if(o.can_call) {

      return {
        action: "call"
      };

    }


    return {
      action: "fold"
    };

  }
   
   /* ==========================================================
     마스터 캐릭터

     - 승률
     - 팟 오즈
     - 콜 부담
     - 상대 수
     - 적절한 블러핑
  ========================================================== */

  function decideMaster(
    context
  ) {

    const {

      equity,
      options,
      potOdds,
      opponentCount,
      street

    } =
    context;


    const o =
      options;


    const call =
      num(
        o.call_amount
      );


    const chips =
      Math.max(
        1,
        num(
          o.my_chips
        )
      );


    const callPressure =
      call /
      chips;


    /*
      필요한 최소 기대 승률.
      약간의 안전 마진을 둔다.
    */

    const required =
      potOdds +
      0.025;


    /*
      다인팟에서는 블러핑을 줄임
    */

    const headsUpLike =
      opponentCount <= 1;


    const lateStreet =
      street === "turn" ||
      street === "river";


    /*
      명백한 폴드
    */

    if(
      call > 0 &&
      equity <
      required - 0.06
    ) {

      if(
        !(
          headsUpLike &&
          lateStreet &&
          o.can_raise &&
          chance(0.08)
        )
      ) {

        return {
          action: "fold"
        };

      }

    }


    /*
      강한 핸드
    */

    if(
      equity >= 0.72 &&
      o.can_raise
    ) {

      let intensity =
        0.38 +
        (
          equity - 0.72
        ) *
        1.35;


      intensity =
        clamp(
          intensity,
          0.32,
          0.88
        );


      /*
        너무 강하면 가끔 상대를 끌어들이기 위해
        체크/콜을 섞는다.
      */

      if(
        equity > 0.88 &&
        chance(0.22)
      ) {

        if(
          o.can_check
        ) {

          return {
            action: "check"
          };

        }


        if(
          o.can_call
        ) {

          return {
            action: "call"
          };

        }

      }


      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          intensity,

          chaos:
          0.08

        })

      };

    }


    /*
      중간 강도
    */

    if(
      equity >=
      required + 0.07
    ) {

      if(
        o.can_raise &&
        callPressure < 0.18 &&
        chance(
          headsUpLike
          ? 0.30
          : 0.16
        )
      ) {

        return {

          action: "raise",

          raiseTo:
          chooseRaiseTarget({

            options: o,

            intensity:
            randomBetween(
              0.16,
              0.36
            ),

            chaos:
            0.06

          })

        };

      }


      if(
        o.can_call &&
        call > 0
      ) {

        return {
          action: "call"
        };

      }


      if(o.can_check) {

        return {
          action: "check"
        };

      }

    }


    /*
      계산된 블러핑

      상대가 적고
      체크 가능한 상황 또는 콜 부담이 작을 때
      낮은 빈도로 공격.
    */

    const bluffChance =
      headsUpLike
      ?
      (
        lateStreet
        ? 0.16
        : 0.09
      )
      :
      0.035;


    if(
      o.can_raise &&
      callPressure < 0.12 &&
      chance(
        bluffChance
      )
    ) {

      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          randomBetween(
            0.24,
            0.48
          ),

          chaos:
          0.04

        })

      };

    }


    /*
      콜할 가치가 거의 정확히 맞는 경계 상황
    */

    if(
      call > 0 &&
      o.can_call &&
      equity >=
      required - 0.015 &&
      callPressure < 0.24
    ) {

      return {
        action: "call"
      };

    }


    if(o.can_check) {

      return {
        action: "check"
      };

    }


    return {
      action: "fold"
    };

  }


  /* ==========================================================
     생각 시간
  ========================================================== */

  function getThinkingDelay(
    profile,
    decision
  ) {

    let min =
      650;

    let max =
      1550;


    if(
      profile ===
      PROFILE.MOTH
    ) {

      min =
        450;

      max =
        1450;

    }


    if(
      profile ===
      PROFILE.MASTER
    ) {

      min =
        850;

      max =
        1900;

    }


    if(
      decision?.action ===
      "raise"
    ) {

      max +=
        350;

    }


    return randomInt(
      min,
      max
    );

  }


  /* ==========================================================
     메인 판단
  ========================================================== */

  function decide({

    profile,
    street,
    holeCards,
    communityCards,
    options,
    pot,
    players,
    botId

  }) {

    const selectedProfile =
      Object.values(
        PROFILE
      )
      .includes(
        profile
      )
      ?
      profile
      :
      PROFILE.HONEST;


    const opponentCount =
      getOpponentCount(
        players,
        botId
      );


    let equity =
      0.5;


    if(
      street ===
      "preflop"
    ) {

      equity =
        preflopStrength(
          holeCards
        );

    } else {

      let iterations =
        250;


      if(
        selectedProfile ===
        PROFILE.HONEST
      ) {

        iterations =
          180;

      }


      if(
        selectedProfile ===
        PROFILE.MOTH
      ) {

        iterations =
          120;

      }


      if(
        selectedProfile ===
        PROFILE.MASTER
      ) {

        iterations =
          450;

      }


      equity =
        estimateEquity({

          holeCards,
          communityCards,
          opponentCount,
          iterations

        });

    }


    const potOdds =
      getPotOdds(
        pot,
        options?.call_amount
      );


    const context = {

      profile:
      selectedProfile,

      street,

      holeCards,

      communityCards,

      options,

      pot,

      players,

      botId,

      opponentCount,

      equity,

      potOdds

    };


    let decision =
      null;


    if(
      selectedProfile ===
      PROFILE.HONEST
    ) {

      decision =
        decideHonest(
          context
        );

    }


    if(
      selectedProfile ===
      PROFILE.MOTH
    ) {

      decision =
        decideMoth(
          context
        );

    }


    if(
      selectedProfile ===
      PROFILE.MASTER
    ) {

      decision =
        decideMaster(
          context
        );

    }


    decision =
      sanitizeDecision(
        decision,
        options
      );


    return {

      action:
      decision.action,

      raiseTo:
      decision.raiseTo ??
      null,

      delayMs:
      getThinkingDelay(
        selectedProfile,
        decision
      ),

      equity:
      Number(
        equity.toFixed(
          4
        )
      ),

      potOdds:
      Number(
        potOdds.toFixed(
          4
        )
      ),

      profile:
      selectedProfile

    };

  }


  /* ==========================================================
     외부 공개
  ========================================================== */

  return {

    PROFILE,

    decide,

    estimateEquity,

    preflopStrength,

    evaluateBest

  };

})();


/* ==========================================================
   전역 등록
========================================================== */

window.HoldemBotEngine =
HoldemBotEngine;
