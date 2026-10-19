# からだパズル(骨・関節・筋肉の図パズル)

骨・関節・筋肉のカードを、からだの図の正しい番号にはめていくスマホ向けWebアプリ(PWA)。

- 公開URL: https://kamedono213.github.io/karada-puzzle/
- 種類: 骨(骨格図)・関節(骨格図)・筋肉(前と後ろの筋肉図)
- レベル(レベルごとに出る名前がちがう)
  - 小学生: 4年生の理科「人の体のつくりと運動」くらい。「うでの骨」「ひざ」「力こぶの筋肉」のようなやさしい名前、ふりがなつき
  - 中学生: 上腕骨・肘関節・上腕二頭筋のような正しい名前
  - 高校生: さらに背骨の区分(頸椎・胸椎・腰椎・仙骨・尾骨)、手と足の骨、背中や首の筋肉まで
  - 読みにくい名前(橈骨・腓骨など)には、どのレベルでもふりがな
- ヒント(何回でも使える。星はへらない): ちいき(体の部位と、答えがある範囲の丸)/とくちょう/2つにしぼる
- 記録はその端末のブラウザ(localStorage)に保存

## 図の出典とライセンス
- 骨格図: [Human skeleton front - no labels.svg](https://commons.wikimedia.org/wiki/File:Human_skeleton_front_-_no_labels.svg)
  (Mariana Ruiz Villarreal (LadyofHats), Mikael Häggström) — パブリックドメイン
- 筋肉図: [Muscles front and back.svg](https://commons.wikimedia.org/wiki/File:Muscles_front_and_back.svg)
  (OpenStax, Tomáš Kebert & umimeto.org) — CC BY-SA 4.0。`app/data/muscles.svg` は元の図のまま(改変なし)で、同じ CC BY-SA 4.0 で配布
- 名前の位置・ヒント文はこのアプリで付けたもの

## 位置の決め方と確認
- 骨格図の SVG には骨ごとのグループ(HumerusLeft など)があるので、骨の点は「そのグループの上に乗っているか」を headless Chrome で確かめ、外れていれば近くの骨の上へ自動でずらす(`research/snap.html`)
- 関節は、骨格図を拡大して軟骨(灰色)のあたりに手で置いた(股関節・膝関節は確認後に修正)
- 筋肉図にはグループがないので、確認用の図(`research/debug-*.png`)を見ながら手で置いた
- 小学生レベルの文に、4年生までに習わない漢字がふりがななしで残っていないかを機械で確認

## 作り方
- `data/items.txt` … 出題リスト(種類・レベル・名前と読み・位置・部位・ヒント)
- `node tools/build-data.js` … `app/data/body.json` を作り、図をコピー
- `node tools/make-icons.js` / `node tools/build-pages.js` … アイコン / `docs/` にPWA版
- `node serve.js docs` … http://localhost:5394 で確認
