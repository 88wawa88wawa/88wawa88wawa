/* =====================================================
   ここを編集すると、サイト全体（3ページ）に反映されます
   料金だけは index.html の中の PRICES を編集します
   ===================================================== */
const CONFIG = {
  siteName: "わわクリエイト",     // ← サイト名
  formEndpoint: "https://formspree.io/f/xrpplzbn",          // ← フォームの送信先URL（Formspree なら https://formspree.io/f/xxxx、Web3Forms なら https://api.web3forms.com/submit）
  formAccessKey: "",         // ← Web3Forms を使うときだけ、発行された Access Key を入れる（Formspree なら空のまま）

  // お問い合わせの連絡先。空のままなら「準備中」と表示されます
  contact: {
    email: "waaan0903★gmail.com",   // @の代わりに★を書くと、サイト上では★で表示されます（迷惑メール対策）。押すと本当の@で開きます
    xUrl: "https://x.com/88wawa88wawa",
    xHandle: "@88wawa88wawa"
  },

  // お問い合わせの下に出る、プロフィール風の連絡先カード
  profile: {
    name: "",                // 表示名。空ならサイト名が出ます
    bio: "",                 // ひとこと。空なら出ません（例 "イラストとLive2Dのご依頼を受けています。"）
    icon: ""                 // アイコン画像。正方形がおすすめ（例 "images/icon.png"）。空なら丸い枠だけ出ます
  },

  // トップの大きな背景（ヒーロー）。src が空のときは暗い単色になります
  hero: {
    type: "image",           // "image"（画像）か "video"（動画。Live2Dを始めたらこちら）
    src: "",                 // 例 "images/hero.png" ／ 動画なら "videos/live2d.mp4"
    poster: "",              // 動画のとき、読み込み前に出す画像（例 "images/hero.png"）
    position: "center",      // 見せたい位置 例 "center top" "70% 20%"
    positionMobile: "",      // スマホだけ位置を変えたいとき
    dim: 0.65,               // 暗さ 0〜1（大きいほど暗い。絵が明るいほど上げる）
    blur: 0                  // ぼかし px（0でなし）
  }
};

// 作品の一覧。「新しい順」に上から並べてください。
// トップには上から4件だけが出て、全部は作品ページに出ます。
// title：題名 ／ tag：種類（等身・ミニキャラ・Live2D・量産依頼など。作品ページの絞り込みに出ます）
// src：画像のパス（例 "images/work01.png"）／ desc：ひとこと（省略できます。拡大表示に出ます）
const WORKS = [
  { title: "作品タイトル 01", tag: "等身",     src: "", desc: "" },
  { title: "作品タイトル 02", tag: "ミニキャラ", src: "", desc: "" },
  { title: "作品タイトル 03", tag: "等身",     src: "", desc: "" },
  { title: "作品タイトル 04", tag: "量産依頼",  src: "", desc: "" },
  { title: "作品タイトル 05", tag: "Live2D",   src: "", desc: "" },
  { title: "作品タイトル 06", tag: "等身",     src: "", desc: "" }
];

// 量産依頼。トップの「量産依頼」に、カードとして並びます。
// 1件だけのときは中央に出ます。2件以上になると、左右にスライドする形になり、矢印が出ます。
// title：題名 ／ desc：軽い説明 ／ src：イラストのパス ／ url：Xの投稿のURL（「ご依頼はこちら！」の行き先）
// 増やすときは、下の「// 」を消して使ってください（行の最初の「// 」だけを消します）。足りなければ、同じ形で1行ずつ足せます。
const BULK = [
  { title: "量産依頼 サンプル 01", desc: "ここに軽い説明が入ります。", src: "", url: "" },
  // { title: "量産依頼 サンプル 02", desc: "ここに軽い説明が入ります。", src: "", url: "" },
  // { title: "量産依頼 サンプル 03", desc: "ここに軽い説明が入ります。", src: "", url: "" },
  // { title: "量産依頼 サンプル 04", desc: "ここに軽い説明が入ります。", src: "", url: "" },
];

// キャンペーン（HP公開記念の割引）。見積もりの「キャンペーン割引」のチェックと、期限つきの「キャンペーン中」表示になります。
// 期限（endDate）の日の終わりまで有効で、過ぎると表示も割引も自動で消えます。endDate が空・不正でも消えます。
// endDate の形式：2026-11-30（この日の終わりまで）
const CAMPAIGN = {
  enabled: true,                    // false にするとキャンペーンを止められます
  name: "HP公開記念キャンペーン",
  rate: 0.15,                       // 0.15 = 15%OFF（イラストもLive2Dも、合計に対してかかります）
  endDate: "2026-11-30",            // 最終日
  withLive2dSenchaku: false         // Live2Dの先着特典と一緒に使えるか（false＝どちらか一方）
};

// お問い合わせのときに書いていただきたいこと（案）。
// ・フォームの「ご相談内容」には、最初からこの形で入っています。
// ・XやメールのDM用には、「相談テンプレートをコピー」ボタンでコピーできます（見積もりを選んでいれば、その内容も入ります）。
// label：項目名 ／ hint：書き方の例 ／ form:false にすると、フォームの入力欄には入りません（フォームに専用の欄があるもの）
// formNote：フォームの入力欄にだけ、hint の次の行に出る補足（XやメールのDM用のコピーには入りません）
// dm:false にすると、項目ごと、XやメールのDM用のコピーに入らなくなります
// estimate:true の項目には、DM用のコピーのとき、サイトで選んだ見積もりが入ります
const INQUIRY_TEMPLATE = [
  { label: "ご依頼者様",           hint: "個人／法人・企業", form: false },
  { label: "ご依頼の内容",         hint: "等身・ミニキャラ・Live2D・量産依頼など。人数や組み合わせも" },
  { label: "キャラクターについて", hint: "設定や、参考にしたい画像・URL",
    formNote: "画像の添付が必要な場合は、画像共有サービス等にアップロードしたURLの添付、もしくはこちらからのメールへの返信に直接添付してください" },
  { label: "使い道",              hint: "配信のアイコン、グッズ、広告など（料金は商用利用込みです）" },
  { label: "希望納期",            hint: "いつまでに欲しいか。急ぎの場合はお知らせください" },
  { label: "ご予算",              hint: "決まっていれば" },
  { label: "見積もり内容",         hint: "サイトの見積もりを貼り付けてください", form: false, estimate: true },
  { label: "その他・ご質問",       hint: "なんでもどうぞ" }
];

// YouTube のお知らせ（トップの実績の下と、実績ページの上に出ます）
// videoId：埋め込む動画のID（動画のURLの「v=」のあと、または shorts/ のあと）。空のあいだは「COMING SOON」と出ます
// isShort：shorts のときは true にすると、縦長で表示されます
const YOUTUBE = {
  enabled: true,
  title: "YouTubeはじめました！",
  text: "Live2Dの制作過程などを載せていきます。",
  channelUrl: "",      // チャンネルのURL（空なら「準備中」）
  videoId: "",         // 例 "dQw4w9WgXcQ"
  isShort: false
};

// 現在のスケジュール（YouTubeの下に出ます）。月ごとの、納期の受付状況です。
// status：◎ 余裕があります ／ 〇 受付可能です ／ △ 内容により受付可能です ／ × 受付不可
// month は「年-月」で書きます。memo は一言添えたいときだけ（省略できます）。月が過ぎたら、一番上の行を消して、下に1行足してください。
// ★ いまの表示は仮です。実際の状況に合わせて書き換えてください。
const SCHEDULE = {
  enabled: true,
  updated: "2026-10-29",     // 最後に更新した日
  months: [
    { month: "2026-11", status: "〇", memo: "" },
    { month: "2026-12", status: "〇", memo: "" },
    { month: "2027-01", status: "〇", memo: "" },
    { month: "2027-02", status: "〇", memo: "" },
    { month: "2027-03", status: "〇", memo: "" }
  ]
};
