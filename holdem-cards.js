/* =========================================================
   HOLDEM A - UNIFIED PLAYING CARD SYSTEM
   holdem-cards.js

   모든 카드 앞면의 단일 원본.
   게임 / 룰북 / 튜토리얼은 이 파일의 cardHtml()을 사용한다.

   SUITS
   ♠ spades   : black
   ♥ hearts   : red
   ♦ diamonds : red
   ♣ clubs    : black

   CARD RULES
   A      : suit x1
   2 ~ 10 : suit x rank value
   J      : large suit
   Q      : large suit + Queen crown
   K      : large suit + King crown
========================================================= */

(function(){

"use strict";


/* =========================================================
   PALETTE
========================================================= */

const CARD_COLORS = Object.freeze({

  purple:"#510E78",

  white:"#FAFAFA",

  black:"#171717",

  red:"#E80000",

  crown:"#FFFF00",

  crownShade:"#FFDD00"

});


/* =========================================================
   SUIT INFORMATION
========================================================= */

const CARD_SUITS = Object.freeze({

  spades:{
    key:"spades",
    symbol:"♠",
    color:CARD_COLORS.black
  },

  hearts:{
    key:"hearts",
    symbol:"♥",
    color:CARD_COLORS.red
  },

  diamonds:{
    key:"diamonds",
    symbol:"♦",
    color:CARD_COLORS.red
  },

  clubs:{
    key:"clubs",
    symbol:"♣",
    color:CARD_COLORS.black
  }

});


/* =========================================================
   ESCAPE
========================================================= */

function cardEscapeHtml(
  value
){

  return String(
    value ?? ""
  )
  .replaceAll(
    "&",
    "&amp;"
  )
  .replaceAll(
    "<",
    "&lt;"
  )
  .replaceAll(
    ">",
    "&gt;"
  )
  .replaceAll(
    '"',
    "&quot;"
  )
  .replaceAll(
    "'",
    "&#039;"
  );

}


/* =========================================================
   NORMALIZE SUIT
========================================================= */

function normalizeCardSuit(
  suit
){

  const raw =
  String(
    suit ?? ""
  )
  .trim()
  .toLowerCase();


  if(
    suit === "♠" ||
    raw === "s" ||
    raw === "spade" ||
    raw === "spades"
  ){

    return "spades";

  }


  if(
    suit === "♥" ||
    raw === "h" ||
    raw === "heart" ||
    raw === "hearts"
  ){

    return "hearts";

  }


  if(
    suit === "♦" ||
    raw === "d" ||
    raw === "diamond" ||
    raw === "diamonds"
  ){

    return "diamonds";

  }


  if(
    suit === "♣" ||
    raw === "c" ||
    raw === "club" ||
    raw === "clubs"
  ){

    return "clubs";

  }


  return "spades";

}


/* =========================================================
   SUIT DRAWING
========================================================= */

function drawCardSuit(
  suit,
  x,
  y,
  size,
  color
){

  const half =
  size / 2;


  /* -------------------------
     DIAMOND
  ------------------------- */

  if(
    suit === "diamonds"
  ){

    return `
      <path
        d="
          M ${x} ${y - half}
          L ${x + half * .72} ${y}
          L ${x} ${y + half}
          L ${x - half * .72} ${y}
          Z
        "
        fill="${color}"
      />
    `;

  }


  /* -------------------------
     HEART
  ------------------------- */

  if(
    suit === "hearts"
  ){

    return `
      <path
        d="
          M ${x} ${y + half * .78}

          C
          ${x - half * .22} ${y + half * .48},
          ${x - half * .90} ${y + half * .04},
          ${x - half * .90} ${y - half * .34}

          C
          ${x - half * .90} ${y - half * .78},
          ${x - half * .40} ${y - half * .92},
          ${x} ${y - half * .48}

          C
          ${x + half * .40} ${y - half * .92},
          ${x + half * .90} ${y - half * .78},
          ${x + half * .90} ${y - half * .34}

          C
          ${x + half * .90} ${y + half * .04},
          ${x + half * .22} ${y + half * .48},
          ${x} ${y + half * .78}

          Z
        "
        fill="${color}"
      />
    `;

  }


  /* -------------------------
     CLUB
  ------------------------- */

  if(
    suit === "clubs"
  ){

    const r =
    size * .19;


    return `
      <g fill="${color}">

        <circle
          cx="${x}"
          cy="${y - size * .22}"
          r="${r}"
        />

        <circle
          cx="${x - size * .21}"
          cy="${y + size * .02}"
          r="${r}"
        />

        <circle
          cx="${x + size * .21}"
          cy="${y + size * .02}"
          r="${r}"
        />

        <path
          d="
            M ${x - size * .09} ${y + size * .02}
            L ${x + size * .09} ${y + size * .02}

            L ${x + size * .11} ${y + size * .25}
            L ${x + size * .21} ${y + size * .38}

            L ${x - size * .21} ${y + size * .38}
            L ${x - size * .11} ${y + size * .25}

            Z
          "
        />

      </g>
    `;

  }


  /* -------------------------
     SPADE
  ------------------------- */

  /*
    하트 뒤집기 식으로 만들지 않는다.

    위 꼭짓점
        ↓
    양쪽 어깨가 부풀어 오름
        ↓
    하단에서 안쪽으로 말림
        ↓
    중앙 목
        ↓
    넓은 받침
  */

  return `
    <path
      d="
        M ${x} ${y - half}

        C
        ${x - half * .10} ${y - half * .72},
        ${x - half * .82} ${y - half * .34},
        ${x - half * .92} ${y + half * .02}

        C
        ${x - half * 1.02} ${y + half * .38},
        ${x - half * .66} ${y + half * .60},
        ${x - half * .36} ${y + half * .47}

        C
        ${x - half * .20} ${y + half * .40},
        ${x - half * .10} ${y + half * .27},
        ${x - half * .05} ${y + half * .16}

        L ${x - half * .10} ${y + half * .58}

        C
        ${x - half * .12} ${y + half * .69},
        ${x - half * .25} ${y + half * .76},
        ${x - half * .40} ${y + half * .82}

        L ${x + half * .40} ${y + half * .82}

        C
        ${x + half * .25} ${y + half * .76},
        ${x + half * .12} ${y + half * .69},
        ${x + half * .10} ${y + half * .58}

        L ${x + half * .05} ${y + half * .16}

        C
        ${x + half * .10} ${y + half * .27},
        ${x + half * .20} ${y + half * .40},
        ${x + half * .36} ${y + half * .47}

        C
        ${x + half * .66} ${y + half * .60},
        ${x + half * 1.02} ${y + half * .38},
        ${x + half * .92} ${y + half * .02}

        C
        ${x + half * .82} ${y - half * .34},
        ${x + half * .10} ${y - half * .72},
        ${x} ${y - half}

        Z
      "
      fill="${color}"
    />
  `;

}


/* =========================================================
   CORNER RANK
========================================================= */

function drawCardRank(
  rank,
  x,
  y,
  color,
  rotate = false
){

  const transform =
  rotate
  ?
  `transform="rotate(180 ${x} ${y})"`
  :
  "";


  const fontSize =
  rank === "10"
  ?
  11
  :
  14;


  return `
    <text
      x="${x}"
      y="${y}"

      ${transform}

      fill="${color}"

      font-family="monospace"
      font-size="${fontSize}"
      font-weight="900"

      text-anchor="middle"
      dominant-baseline="middle"

      shape-rendering="crispEdges"
    >${cardEscapeHtml(rank)}</text>
  `;

}


/* =========================================================
   NUMBER CARD PIP POSITIONS
========================================================= */

const NUMBER_CARD_LAYOUTS = Object.freeze({

  A:[
    [50,50]
  ],


  2:[
    [50,31],
    [50,69]
  ],


  3:[
    [50,27],
    [50,50],
    [50,73]
  ],


  4:[
    [35,30],
    [65,30],

    [35,70],
    [65,70]
  ],


  5:[
    [35,27],
    [65,27],

    [50,50],

    [35,73],
    [65,73]
  ],


  6:[
    [35,25],
    [65,25],

    [35,50],
    [65,50],

    [35,75],
    [65,75]
  ],


  7:[
    [35,23],
    [65,23],

    [50,36],

    [35,50],
    [65,50],

    [35,77],
    [65,77]
  ],


  8:[
    [35,22],
    [65,22],

    [50,35],

    [35,48],
    [65,48],

    [50,61],

    [35,78],
    [65,78]
  ],


  9:[
    [35,21],
    [65,21],

    [35,39],
    [65,39],

    [50,50],

    [35,61],
    [65,61],

    [35,79],
    [65,79]
  ],


  10:[
    [35,19],
    [65,19],

    [50,30],

    [35,41],
    [65,41],

    [35,59],
    [65,59],

    [50,70],

    [35,81],
    [65,81]
  ]

});


/* =========================================================
   NUMBER CARD CENTER
========================================================= */

function drawNumberCardCenter(
  rank,
  suit,
  color
){

  const layout =
  NUMBER_CARD_LAYOUTS[
    rank
  ];


  if(
    !layout
  ){

    return "";

  }


  let size;


  if(
    rank === "A"
  ){

    size = 34;

  }
  else if(
    rank === "2" ||
    rank === "3"
  ){

    size = 20;

  }
  else if(
    rank === "4" ||
    rank === "5" ||
    rank === "6"
  ){

    size = 15;

  }
  else{

    size = 12;

  }


  return layout
  .map(
    ([x,y]) =>
    drawCardSuit(
      suit,
      x,
      y,
      size,
      color
    )
  )
  .join("");

}


/* =========================================================
   QUEEN CROWN
========================================================= */

function drawQueenCrown(){

  return `
    <g>

      <path
        d="
          M 35 42

          L 39 29
          L 47 37

          L 55 25
          L 63 37

          L 71 29
          L 75 42

          Z
        "
        fill="${CARD_COLORS.crown}"
      />

      <rect
        x="37"
        y="40"
        width="36"
        height="7"
        fill="${CARD_COLORS.crown}"
      />

      <rect
        x="37"
        y="45"
        width="36"
        height="3"
        fill="${CARD_COLORS.crownShade}"
      />

    </g>
  `;

}


/* =========================================================
   KING CROWN
========================================================= */

function drawKingCrown(){

  return `
    <g>

      <!-- 뒤쪽 솟은 부분 -->

      <path
        d="
          M 38 39

          L 41 25
          L 49 34

          L 55 20
          L 61 34

          L 69 25
          L 72 39

          Z
        "
        fill="${CARD_COLORS.crownShade}"
      />


      <!-- 앞쪽 왕관 -->

      <path
        d="
          M 34 41

          L 39 29
          L 47 38

          L 55 24
          L 63 38

          L 71 29
          L 76 41

          L 73 49

          Q 55 55 37 49

          Z
        "
        fill="${CARD_COLORS.crown}"
      />


      <!-- 둥근 하단 면 -->

      <path
        d="
          M 37 46

          Q 55 53 73 46

          L 72 53

          Q 55 60 38 53

          Z
        "
        fill="${CARD_COLORS.crownShade}"
      />


      <!-- 보석 주변 음영 -->

      <rect
        x="51"
        y="43"
        width="2"
        height="2"
        fill="${CARD_COLORS.crownShade}"
      />

      <rect
        x="57"
        y="43"
        width="2"
        height="2"
        fill="${CARD_COLORS.crownShade}"
      />

      <rect
        x="51"
        y="49"
        width="2"
        height="2"
        fill="${CARD_COLORS.crownShade}"
      />

      <rect
        x="57"
        y="49"
        width="2"
        height="2"
        fill="${CARD_COLORS.crownShade}"
      />


      <!-- 보라색 보석 -->

      <rect
        x="53"
        y="45"
        width="4"
        height="4"
        fill="${CARD_COLORS.purple}"
      />

    </g>
  `;

}


/* =========================================================
   FACE CARD CENTER
========================================================= */

function drawFaceCardCenter(
  rank,
  suit,
  color
){

  if(
    rank === "J"
  ){

    return `
      <g>

        ${drawCardSuit(
          suit,
          50,
          51,
          43,
          color
        )}

      </g>
    `;

  }


  if(
    rank === "Q"
  ){

    return `
      <g>

        ${drawCardSuit(
          suit,
          50,
          60,
          42,
          color
        )}

        ${drawQueenCrown()}

      </g>
    `;

  }


  return `
    <g>

      ${drawCardSuit(
        suit,
        50,
        61,
        43,
        color
      )}

      ${drawKingCrown()}

    </g>
  `;

}


/* =========================================================
   CARD SVG
========================================================= */

function pixelCardSvg(
  rank,
  suit
){

  rank =
  String(
    rank ?? "?"
  )
  .toUpperCase();


  suit =
  normalizeCardSuit(
    suit
  );


  const suitInfo =
  CARD_SUITS[
    suit
  ];


  const color =
  suitInfo.color;


  const isFaceCard =
  (
    rank === "J" ||
    rank === "Q" ||
    rank === "K"
  );


  const center =
  isFaceCard
  ?
  drawFaceCardCenter(
    rank,
    suit,
    color
  )
  :
  drawNumberCardCenter(
    rank,
    suit,
    color
  );


  return `
    <svg
      class="pixelCardSvg"

      viewBox="0 0 100 140"

      xmlns="http://www.w3.org/2000/svg"

      aria-hidden="true"
    >

      <!-- purple outside frame -->

      <rect
        x="2"
        y="2"
        width="96"
        height="136"

        rx="8"

        fill="${CARD_COLORS.purple}"
      />


      <!-- card face -->

      <rect
        x="7"
        y="7"
        width="86"
        height="126"

        rx="6"

        fill="${CARD_COLORS.white}"
      />


      <!-- upper rank -->

      ${drawCardRank(
        rank,
        16,
        18,
        color,
        false
      )}


      <!-- lower rank -->

      ${drawCardRank(
        rank,
        84,
        122,
        color,
        true
      )}


      <!-- center artwork -->

      <g
        transform="
          translate(0 20)
          scale(1 .95)
        "
      >

        ${center}

      </g>

    </svg>
  `;

}


/* =========================================================
   PUBLIC CARD HTML
========================================================= */

function cardHtml(
  card
){

  if(
    !card
  ){

    return `
      <div class="cardPlaceholder"></div>
    `;

  }


  const rank =
  String(
    card.rank_text ??
    card.rank ??
    "?"
  )
  .toUpperCase();


  const suit =
  card.suit ??
  "?";


  return `
    <div
      class="pixelCard"

      data-rank="${cardEscapeHtml(rank)}"
      data-suit="${cardEscapeHtml(suit)}"
    >

      ${pixelCardSvg(
        rank,
        suit
      )}

    </div>
  `;

}


/* =========================================================
   CARD BACK
========================================================= */

function cardBackHtml(){

  return `
    <div class="pixelCard pixelCardBack"></div>
  `;

}


/* =========================================================
   UNKNOWN CARD
========================================================= */

function unknownCardHtml(){

  return `
    <div class="pixelCard unknown">
      ?
    </div>
  `;

}


/* =========================================================
   RULEBOOK COMPATIBILITY
========================================================= */

function ruleCard(
  rank,
  suit,
  red = false
){

  return cardHtml({

    rank_text:
    rank,

    suit:
    suit

  });

}


function ruleUnknownCard(){

  return unknownCardHtml();

}


/* =========================================================
   EXPORT

   기존 index.html이 module 방식이 아니므로
   window에 공개한다.
========================================================= */

window.pixelCardSvg =
pixelCardSvg;


window.cardHtml =
cardHtml;


window.cardBackHtml =
cardBackHtml;


window.unknownCardHtml =
unknownCardHtml;


window.ruleCard =
ruleCard;


window.ruleUnknownCard =
ruleUnknownCard;


})();
