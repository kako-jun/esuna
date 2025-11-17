/**
 * 青空文庫の人気作品リスト
 */

export interface Novel {
  id: string;
  title: string;
  author: string;
  authorId: string;
  fileId: string;
  url: string;
  description: string;
}

/**
 * 青空文庫の人気作品
 */
export const POPULAR_NOVELS: Novel[] = [
  {
    id: '773_14560',
    title: 'こころ',
    author: '夏目漱石',
    authorId: '000148',
    fileId: '773_14560',
    url: 'https://www.aozora.gr.jp/cards/000148/files/773_14560.html',
    description: '先生と私の友情と、先生の過去の恋愛をめぐる物語。明治の精神を描いた代表作。',
  },
  {
    id: '301_14912',
    title: '人間失格',
    author: '太宰治',
    authorId: '000035',
    fileId: '301_14912',
    url: 'https://www.aozora.gr.jp/cards/000035/files/301_14912.html',
    description: '社会への不適応と自己嫌悪に苦しむ主人公の手記。太宰文学の集大成。',
  },
  {
    id: '127_15260',
    title: '羅生門',
    author: '芥川龍之介',
    authorId: '000879',
    fileId: '127_15260',
    url: 'https://www.aozora.gr.jp/cards/000879/files/127_15260.html',
    description: '平安時代の荒廃した京都を舞台に、人間のエゴイズムを描いた短編。',
  },
  {
    id: '456_15050',
    title: '銀河鉄道の夜',
    author: '宮沢賢治',
    authorId: '000081',
    fileId: '456_15050',
    url: 'https://www.aozora.gr.jp/cards/000081/files/456_15050.html',
    description: '少年ジョバンニが銀河鉄道に乗って旅をするファンタジー。',
  },
  {
    id: '752_14964',
    title: '坊っちゃん',
    author: '夏目漱石',
    authorId: '000148',
    fileId: '752_14964',
    url: 'https://www.aozora.gr.jp/cards/000148/files/752_14964.html',
    description: '正義感の強い青年教師が田舎の中学校で巻き起こす騒動を描いたユーモア小説。',
  },
  {
    id: '1567_14913',
    title: '走れメロス',
    author: '太宰治',
    authorId: '000035',
    fileId: '1567_14913',
    url: 'https://www.aozora.gr.jp/cards/000035/files/1567_14913.html',
    description: '友情と信頼をテーマにした短編。メロスの純粋な心を描く。',
  },
  {
    id: '92_14545',
    title: '蜘蛛の糸',
    author: '芥川龍之介',
    authorId: '000879',
    fileId: '92_14545',
    url: 'https://www.aozora.gr.jp/cards/000879/files/92_14545.html',
    description: '地獄に落ちた男に下りてくる蜘蛛の糸。人間のエゴイズムを描いた寓話。',
  },
  {
    id: '789_14547',
    title: '吾輩は猫である',
    author: '夏目漱石',
    authorId: '000148',
    fileId: '789_14547',
    url: 'https://www.aozora.gr.jp/cards/000148/files/789_14547.html',
    description: '猫の視点から人間社会を風刺したユーモア小説。',
  },
  {
    id: '1565_8559',
    title: '斜陽',
    author: '太宰治',
    authorId: '000035',
    fileId: '1565_8559',
    url: 'https://www.aozora.gr.jp/cards/000035/files/1565_8559.html',
    description: '没落する華族の姿を通して、戦後の価値観の変化を描く。',
  },
];
