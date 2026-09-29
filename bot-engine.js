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
      potOdds,
      street
    } = context;


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
      HONEST / 김용우

      핵심 성향

      - 처음에는 콜로 들어갈 수 있음
      - 애매한 패에서는 콜 위주
      - 압박이 커지면 빠르게 포기
      - 약한 패 블러프는 거의 하지 않음
      - 강한 패에서는 확실하게 큰 공격 가능
      - 베팅 크기는 비교적 작고 단계적으로 증가
      - 손실 최소화를 중요하게 생각함
      - 탈락 직전에는 예외적으로 약한 패 올인 가능
      ==========================================================
    */


    const required =
      potOdds +
      0.035;


    /*
      패 강도 구간
    */

    let strength =
      0;


    if(
      equity >= 0.32
    ) {

      strength =
        1;

    }


    if(
      equity >= 0.45
    ) {

      strength =
        2;

    }


    if(
      equity >= 0.62
    ) {

      strength =
        3;

    }


    if(
      equity >= 0.78
    ) {

      strength =
        4;

    }


    /*
      ==========================================================
      최후 승부

      자유서술 반영.

      "패가 약하고 칩이 적어
       다음 판 참여 가능성이 낮으면
       이번이 마지막 판이라고 생각하고
       올인하기도 한다."

      현재 엔진에는 시작 스택이나
      다음 판 최소 참가칩 정보가 없으므로
      '현재 콜 금액이 남은 칩의 대부분을
       차지하는 상황'을 탈락 위기의
      보수적인 대용 지표로 사용한다.

      평상시 약한 패 올인이 아니라
      극단적 위기에서만 드물게 발생한다.
      ==========================================================
    */

    const lastStandSituation =
      call > 0 &&
      callPressure >= 0.72;


    if(
      lastStandSituation &&
      strength <= 1 &&
      o.can_raise &&
      max > 0 &&
      chance(
        0.14
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
      ==========================================================
      큰 압박

      설문 05 / 07 / 08 / 10 반영.

      김용우는 약하거나 애매한 패로
      큰 압박을 오래 버티지 않는다.
      ==========================================================
    */

    if(
      call > 0 &&
      callPressure >= 0.28 &&
      strength <= 2
    ) {

      if(o.can_fold) {

        return {
          action: "fold"
        };

      }

    }


    /*
      승률이 팟 오즈에 비해
      명확하게 부족하면 손실을 끊는다.
    */

    if(
      call > 0 &&
      equity <
      required - 0.045 &&
      strength <= 1
    ) {

      if(o.can_fold) {

        return {
          action: "fold"
        };

      }

    }


    /*
      ==========================================================
      매우 강한 패

      설문 04 반영.

      강한 패에서는 오히려
      큰 레이즈를 선호한다.

      김용우의 큰 베팅은
      블러프가 아니라 실제 강한 패와
      비교적 직접적으로 연결된다.
      ==========================================================
    */

    if(
      strength === 4 &&
      o.can_raise
    ) {

      let intensity =
        randomBetween(
          0.64,
          0.92
        );


      /*
        프리플랍보다 후반 스트리트에서
        조금 더 큰 가치 베팅을 허용.
      */

      if(
        street === "turn" ||
        street === "river"
      ) {

        intensity =
          randomBetween(
            0.72,
            0.96
          );

      }


      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          intensity,

          chaos:
          0.02

        })

      };

    }


    /*
      ==========================================================
      좋은 패

      적당한 베팅에서 시작해서
      점점 키우는 성향.

      무조건 공격하지 않고
      일부 콜도 허용한다.
      ==========================================================
    */

    if(
      strength === 3
    ) {

      let raiseChance =
        0.54;


      if(
        callPressure >= 0.20
      ) {

        raiseChance -=
          0.10;

      }


      if(
        o.can_raise &&
        chance(
          clamp(
            raiseChance,
            0.32,
            0.62
          )
        )
      ) {

        let minIntensity =
          0.22;


        let maxIntensity =
          0.46;


        if(
          street === "turn"
        ) {

          minIntensity =
            0.30;

          maxIntensity =
            0.56;

        }


        if(
          street === "river"
        ) {

          minIntensity =
            0.38;

          maxIntensity =
            0.66;

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
            0.02

          })

        };

      }


      if(
        call > 0 &&
        o.can_call
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
      ==========================================================
      중간 패

      설문 01 / 02 / 03 반영.

      기본적으로 콜/체크 위주.
      공격적으로 키우지 않는다.
      ==========================================================
    */

    if(
      strength === 2
    ) {

      if(
        call > 0 &&
        o.can_call
      ) {

        let callChance =
          0.68;


        callChance -=
          callPressure *
          1.15;


        if(
          equity >= required
        ) {

          callChance +=
            0.08;

        }


        if(
          chance(
            clamp(
              callChance,
              0.16,
              0.76
            )
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

    }


    /*
      ==========================================================
      약한 패

      작은 금액까지는 볼 수 있지만
      상대가 계속 밀면 쉽게 포기한다.
      ==========================================================
    */

    if(
      call > 0 &&
      o.can_call &&
      strength <= 1
    ) {

      let callChance =
        strength === 1
        ? 0.42
        : 0.25;


      /*
        아주 싼 콜은 설문 01/09에 따라
        조금 더 자주 받아준다.
      */

      if(
        callPressure <= 0.05
      ) {

        callChance +=
          0.24;

      }


      if(
        callPressure >= 0.10
      ) {

        callChance -=
          0.14;

      }


      if(
        callPressure >= 0.18
      ) {

        callChance -=
          0.20;

      }


      if(
        chance(
          clamp(
            callChance,
            0.04,
            0.68
          )
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
      ==========================================================
      매우 드문 블러프

      설문 12 / 13 / 19 반영.

      체크할 수 있는 상황에서조차
      대부분 같이 체크한다.

      단, 후반 스트리트에서
      상대가 약해 보일 수 있는 상황에
      아주 낮은 확률로만 블러프한다.

      한 번 블러프를 선택하면
      작은 찌르기가 아니라
      어느 정도 강한 패처럼 베팅한다.
      ==========================================================
    */

    if(
      o.can_raise &&
      call === 0 &&
      (
        street === "turn" ||
        street === "river"
      ) &&
      chance(
        0.045
      )
    ) {

      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          randomBetween(
            0.38,
            0.62
          ),

          chaos:
          0.02

        })

      };

    }


    /*
      무료로 다음 카드를 볼 수 있으면
      대부분 체크.
    */

    if(o.can_check) {

      return {
        action: "check"
      };

    }


    /*
      마지막 안전장치.

      콜할 수 있어도 비용이 크지 않고
      최소 기대 승률을 충족할 때만 콜.
    */

    if(
      o.can_call &&
      call > 0 &&
      equity >= required &&
      callPressure < 0.16
    ) {

      return {
        action: "call"
      };

    }


    return {
      action: "fold"
    };

  }  /* ==========================================================
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
    } = context;


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
      MASTER / 제선 팍

      핵심 성향

      - 불필요한 큰 싸움을 피함
      - 강한 패를 콜/체크로 숨기는 비율이 높음
      - 약한 패도 선택적으로 강한 패처럼 연기
      - 블러프를 시작하면 쉽게 끊지 않는 성향
      - 상대 압박에는 패가 없으면 손실 최소화
      - 베팅 크기를 일부러 일정하게 만들지 않음
      - 위기라고 무조건 도박하지 않음
      - 확실하거나 승부 가치가 생기면 강하게 공격
      ==========================================================
    */


    const required =
      potOdds +
      0.025;


    const headsUpLike =
      opponentCount <= 1;


    const lateStreet =
      street === "turn" ||
      street === "river";


    /*
      이번 판단의 플레이 스타일 변화.

      제선 팍은 항상 같은 크기로
      같은 행동을 하지 않는다.

      이 값은 패의 강도를 바꾸는 것이 아니라
      같은 상황에서 어떤 라인을 선택할지를 흔든다.
    */

    const temperament =
      Math.random();


    const deceptive =
      temperament >= 0.62;


    const committed =
      temperament >= 0.84;


    /*
      패 강도 구간.
    */

    let strength =
      0;


    if(
      equity >= 0.32
    ) {

      strength =
        1;

    }


    if(
      equity >= 0.46
    ) {

      strength =
        2;

    }


    if(
      equity >= 0.62
    ) {

      strength =
        3;

    }


    if(
      equity >= 0.78
    ) {

      strength =
        4;

    }


    /*
      ==========================================================
      1. 큰 압박을 받았을 때

      설문 06 / 07 / 20 반영.

      약한 패로 상대의 큰 공격을
      무작정 따라가지 않는다.

      이것이 김효진과 가장 큰 차이 중 하나다.
      ==========================================================
    */

    if(
      call > 0 &&
      callPressure >= 0.32 &&
      strength <= 1
    ) {

      /*
        극히 일부만 선택적 블러프 재공격.
        평상시에는 손실 최소화.
      */

      if(
        headsUpLike &&
        o.can_raise &&
        deceptive &&
        chance(
          0.10
        )
      ) {

        return {

          action: "raise",

          raiseTo:
          chooseRaiseTarget({

            options: o,

            intensity:
            randomBetween(
              0.48,
              0.82
            ),

            chaos:
            0.08

          })

        };

      }


      if(o.can_fold) {

        return {
          action: "fold"
        };

      }

    }


    /*
      ==========================================================
      2. 매우 강한 패

      설문 04 반영.

      강한 패라고 바로 공격하지 않는다.
      상대에게 약하게 보이도록
      체크/콜을 상당히 자주 섞는다.
      ==========================================================
    */

    if(
      strength === 4
    ) {

      let trapChance =
        0.46;


      /*
        프리플랍에서도 숨길 수 있지만
        플랍 이후 트랩 비중을 더 높인다.
      */

      if(
        street !== "preflop"
      ) {

        trapChance +=
          0.08;

      }


      /*
        상대가 이미 큰 금액을 밀어 넣었다면
        트랩보다 가치 확보를 조금 더 선호.
      */

      if(
        callPressure >= 0.24
      ) {

        trapChance -=
          0.12;

      }


      if(
        chance(
          clamp(
            trapChance,
            0.24,
            0.62
          )
        )
      ) {

        if(
          call > 0 &&
          o.can_call
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


      if(o.can_raise) {

        /*
          강한 패의 베팅 크기도 고정하지 않는다.

          작은 유도 베팅부터
          큰 가치 베팅까지 섞는다.
        */

        let intensity;


        const sizeRoll =
          Math.random();


        if(
          sizeRoll < 0.24
        ) {

          intensity =
            randomBetween(
              0.14,
              0.28
            );

        } else if(
          sizeRoll < 0.64
        ) {

          intensity =
            randomBetween(
              0.34,
              0.58
            );

        } else {

          intensity =
            randomBetween(
              0.68,
              0.94
            );

        }


        return {

          action: "raise",

          raiseTo:
          chooseRaiseTarget({

            options: o,

            intensity:
            intensity,

            chaos:
            0.10

          })

        };

      }

    }


    /*
      ==========================================================
      3. 좋은 패

      좋은 패는 공격하되
      무조건 레이즈하지 않는다.

      콜을 섞어서 패를 숨기고
      상대가 계속 들어오도록 허용한다.
      ==========================================================
    */

    if(
      strength === 3
    ) {

      let raiseChance =
        0.48;


      if(
        callPressure < 0.15
      ) {

        raiseChance +=
          0.08;

      }


      if(
        lateStreet
      ) {

        raiseChance +=
          0.06;

      }


      if(
        deceptive
      ) {

        raiseChance -=
          0.13;

      }


      if(
        o.can_raise &&
        chance(
          clamp(
            raiseChance,
            0.28,
            0.68
          )
        )
      ) {

        let intensity;


        /*
          설문 16:
          상황에 따라 베팅 크기가
          극단적으로 달라질 수 있음.
        */

        if(
          chance(
            0.38
          )
        ) {

          intensity =
            randomBetween(
              0.58,
              0.90
            );

        } else {

          intensity =
            randomBetween(
              0.20,
              0.48
            );

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


      if(
        call > 0 &&
        o.can_call
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
      ==========================================================
      4. 중간 패

      기본적으로 상황을 관찰한다.

      싸게 볼 수 있으면 콜,
      비싸지면 빠질 수 있으며,
      좋은 공격 기회에서는 선택적으로 레이즈.
      ==========================================================
    */

    if(
      strength === 2
    ) {

      let mediumRaiseChance =
        headsUpLike
        ? 0.28
        : 0.16;


      if(
        callPressure >= 0.18
      ) {

        mediumRaiseChance -=
          0.10;

      }


      if(
        deceptive &&
        headsUpLike
      ) {

        mediumRaiseChance +=
          0.08;

      }


      if(
        o.can_raise &&
        chance(
          clamp(
            mediumRaiseChance,
            0.06,
            0.42
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
              0.22,
              0.56
            ),

            chaos:
            0.06

          })

        };

      }


      if(
        call > 0 &&
        o.can_call
      ) {

        let callChance =
          0.67;


        callChance -=
          callPressure *
          0.72;


        if(
          equity >= required
        ) {

          callChance +=
            0.10;

        }


        if(
          chance(
            clamp(
              callChance,
              0.18,
              0.82
            )
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

    }


    /*
      ==========================================================
      5. 선택적 블러프

      설문 09 / 12 / 14 / 19 반영.

      아무 약한 패나 공격하는 것이 아니다.

      상대 수가 적고,
      부담이 크지 않으며,
      상대를 폴드시킬 여지가 있다고 볼 때
      강한 패처럼 공격한다.
      ==========================================================
    */

    let bluffChance =
      0.04;


    if(
      headsUpLike
    ) {

      bluffChance =
        0.13;

    }


    if(
      headsUpLike &&
      lateStreet
    ) {

      bluffChance =
        0.20;

    }


    if(
      deceptive
    ) {

      bluffChance +=
        0.08;

    }


    /*
      큰 베팅을 이미 맞고 있는 상황에서는
      허세로 돈을 계속 태우지 않는다.
    */

    if(
      callPressure >= 0.18
    ) {

      bluffChance *=
        0.42;

    }


    if(
      callPressure >= 0.30
    ) {

      bluffChance *=
        0.25;

    }


    if(
      o.can_raise &&
      chance(
        clamp(
          bluffChance,
          0.01,
          0.32
        )
      )
    ) {

      /*
        블러프가 선택됐을 때는
        소심한 찌르기보다
        실제 강한 패처럼 보이게 한다.

        committed가 걸리면
        특히 큰 사이즈를 사용한다.
      */

      let bluffIntensity;


      if(
        committed
      ) {

        bluffIntensity =
          randomBetween(
            0.62,
            0.92
          );

      } else if(
        chance(
          0.46
        )
      ) {

        bluffIntensity =
          randomBetween(
            0.42,
            0.68
          );

      } else {

        bluffIntensity =
          randomBetween(
            0.20,
            0.40
          );

      }


      return {

        action: "raise",

        raiseTo:
        chooseRaiseTarget({

          options: o,

          intensity:
          bluffIntensity,

          chaos:
          0.08

        })

      };

    }


    /*
      ==========================================================
      6. 약한 패의 콜

      설문 01 / 03 / 05 반영.

      처음부터 전부 폴드하지는 않는다.
      싸게 볼 수 있으면 콜하지만,
      비용이 커지면 손실을 끊는다.
      ==========================================================
    */

    if(
      call > 0 &&
      o.can_call
    ) {

      let callChance =
        strength === 1
        ? 0.48
        : 0.32;


      if(
        callPressure < 0.06
      ) {

        callChance +=
          0.18;

      }


      if(
        callPressure >= 0.15
      ) {

        callChance -=
          0.18;

      }


      if(
        callPressure >= 0.25
      ) {

        callChance -=
          0.24;

      }


      /*
        계산상 콜 가치가 있다면
        약간 더 오래 남는다.
      */

      if(
        equity >=
        required - 0.015
      ) {

        callChance +=
          0.12;

      }


      if(
        chance(
          clamp(
            callChance,
            0.05,
            0.72
          )
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
      체크할 수 있으면
      불필요하게 칩을 쓰지 않고
      다음 상황을 본다.
    */

    if(o.can_check) {

      return {
        action: "check"
      };

    }


    return {
      action: "fold"
    };

  }  /* ==========================================================
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
