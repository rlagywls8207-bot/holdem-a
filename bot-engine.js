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
      BBB 불나방

      기본 성향
      - 폴드를 싫어함
      - 콜을 쉽게 함
      - 레이즈를 자주 함
      - 약한 패로도 블러프 가능
      - 하지만 근거 없는 올인은 드묾
      - 플랍 이후에는 프리플랍보다 더 난폭해짐
    */

    const madness =
      Math.random();


    /*
      ----------------------------------------------------------
      프리플랍
      ----------------------------------------------------------

      equity 대략 분류

      < 0.30  : 쓰레기
      < 0.43  : 약함
      < 0.58  : 보통
      < 0.75  : 좋음
      >= 0.75 : 최상급

      올인은 패 강도와 어느 정도 연결한다.
    */

    if(
      street === "preflop"
    ) {
      let allInChance =
        0.002;


      if(
        equity >= 0.43
      ) {

        allInChance =
          0.003;

      }


      if(
        equity >= 0.58
      ) {

        allInChance =
          0.005;

      }


      if(
        equity >= 0.75
      ) {

        allInChance =
          0.008;

      }


      /*
        남은 스택이 적으면
        불나방답게 올인 범위가 넓어진다.

        callPressure가 크다는 것은
        현재 콜 금액이 자기 남은 칩에서
        상당한 비중을 차지한다는 뜻이다.
      */

      if(
        callPressure >= 0.45
      ) {

        allInChance +=
          0.08;

      }


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
        일반 레이즈.

        약한 패도 충분히 레이즈하지만
        기존처럼 무조건적인 폭주 확률로
        결정하지 않는다.
      */

      let raiseChance =
        0.14;


      if(
        equity >= 0.30
      ) {

        raiseChance =
          0.27;

      }


      if(
        equity >= 0.43
      ) {

        raiseChance =
          0.38;

      }


      if(
        equity >= 0.58
      ) {

        raiseChance =
          0.55;

      }


      if(
        equity >= 0.75
      ) {

        raiseChance =
          0.55;

      }


      /*
        BBB 특유의 변덕.

        약한 패에서도 가끔
        갑자기 공격적으로 변한다.
      */

      if(
        madness > 0.88
      ) {

        raiseChance +=
          0.12;

      }


      if(
        o.can_raise &&
        chance(
          raiseChance
        )
      ) {

        return {

          action: "raise",

          raiseTo:
          chooseRaiseTarget({

            options: o,

            intensity:
            randomBetween(
              0.18,
              equity >= 0.58
              ? 0.78
              : 0.58
            ),

            chaos:
            0.38

          })

        };

      }


      /*
        콜 판단.

        BBB는 약한 패도 싸게 볼 수 있으면
        상당히 자주 따라간다.

        다만 상대의 큰 베팅은
        완전히 무시하지 않는다.
      */

      if(
        call > 0 &&
        o.can_call
      ) {

        let callChance =
          0.50;


        if(
          equity < 0.30
        ) {

          callChance =
            0.50;

        } else if(
          equity < 0.43
        ) {

          callChance =
            0.58;

        } else if(
          equity < 0.58
        ) {

          callChance =
            0.68;

        } else {

          callChance =
            0.82;

        }


        /*
          요구 금액이 커질수록
          BBB도 조금은 겁을 먹는다.
        */

        callChance -=
          callPressure *
          0.45;


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


    /*
      ----------------------------------------------------------
      플랍 / 턴 / 리버
      ----------------------------------------------------------

      프리플랍보다 공격성을 높인다.

      equity가 높으면 실제 강한 패 또는
      강한 드로우일 가능성이 있으므로
      큰 공격까지 허용한다.

      낮은 equity에서도 블러프 레이즈는 가능하지만
      무근거 올인은 매우 드물게 한다.
    */

    let postflopAllInChance =
      0.002;


    if(
      equity >= 0.35
    ) {

      postflopAllInChance =
        0.003;

    }


    if(
      equity >= 0.50
    ) {

      postflopAllInChance =
        0.004;

    }


    if(
      equity >= 0.65
    ) {

      postflopAllInChance =
        0.006;

    }


    if(
      equity >= 0.80
    ) {

      postflopAllInChance =
        0.008;

    }
    


    /*
      이미 큰 결정을 요구받는 상황에서는
      평소보다 올인 쪽으로 조금 더 기운다.
    */

    if(
      callPressure >= 0.45
    ) {

      postflopAllInChance =
        Math.min(
          0.009,
          postflopAllInChance + 0.001
        );

    }

    if(
      o.can_raise &&
      max > 0 &&
      chance(
        postflopAllInChance
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
      플랍 이후 일반 공격성.

      아무것도 없어도 블러프 가능.
      승률이 조금만 생겨도 공격성이
      빠르게 올라간다.
    */

    let aggressionChance =
      0.12;


    if(
      equity >= 0.30
    ) {

      aggressionChance =
        0.24;

    }


    if(
      equity >= 0.45
    ) {

      aggressionChance =
        0.40;

    }


    if(
      equity >= 0.60
    ) {

      aggressionChance =
        0.58;

    }


    if(
      equity >= 0.75
    ) {

      aggressionChance =
        0.72;

    }


    /*
      가끔 패와 무관하게 욱해서
      레이즈하는 불나방 성향.
      단, 여기서는 자동 올인이 아니다.
    */

    if(
      madness > 0.90
    ) {

      aggressionChance +=
        0.12;

    }


    if(
      o.can_raise &&
      chance(
        aggressionChance
      )
    ) {

      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          randomBetween(
            equity >= 0.60
            ? 0.38
            : 0.18,

            equity >= 0.60
            ? 0.88
            : 0.62
          ),

          chaos:
          0.42

        })

      };

    }


    /*
      BBB는 콜을 상당히 좋아한다.
      그러나 큰 베팅에는 어느 정도 반응한다.
    */

    if(
      call > 0 &&
      o.can_call
    ) {

      let willingness =
        0.54 +
        (
          equity *
          0.34
        );


      willingness -=
        callPressure *
        0.38;


      willingness -=
        potOdds *
        0.08;


      if(
        chance(
          willingness
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
      체크할 수 있어도
      가끔 괜히 한 번 더 찌른다.
    */

    if(
      o.can_raise &&
      chance(
        0.12
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
            0.48
          ),

          chaos:
          0.32

        })

      };

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
