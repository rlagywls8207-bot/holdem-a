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
  24
  :
  29;


  return `
    <text
      x="${x}"
      y="${y}"

      ${transform}

      fill="${color}"

      font-family="Arial Black, Arial, sans-serif"
      font-size="${fontSize}"
      font-weight="900"

      text-anchor="middle"
      dominant-baseline="middle"

      stroke="${color}"
      stroke-width="0.7"
      paint-order="stroke fill"
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
   FACE CARD CENTER
========================================================= */

function drawFaceCardCenter(
  rank,
  suit,
  color
){

  const sizes = {

    J:38,
    Q:44,
    K:50

  };


  const decorations = {

    J:`
      <rect
        x="37"
        y="73"
        width="26"
        height="4"
        rx="2"
        fill="${color}"
        opacity=".45"
      />
    `,

    Q:`
      <rect
        x="34"
        y="76"
        width="32"
        height="4"
        rx="2"
        fill="${color}"
      />

      <rect
        x="39"
        y="82"
        width="22"
        height="3"
        rx="1.5"
        fill="${color}"
        opacity=".45"
      />
    `,

    K:`
      <rect
        x="31"
        y="78"
        width="38"
        height="5"
        rx="2"
        fill="${color}"
      />

      <rect
        x="36"
        y="86"
        width="28"
        height="4"
        rx="2"
        fill="${color}"
      />
    `

  };


  return `
    <g>

      ${drawCardSuit(
        suit,
        50,
        48,
        sizes[rank] ?? 42,
        color
      )}

      ${decorations[rank] ?? ""}

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
  19,
  22,
  color,
  false
)}


      <!-- lower rank -->

${drawCardRank(
  rank,
  81,
  118,
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
