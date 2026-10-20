// 使用前請將動畫 GIF 放在專案的 assets/p5-animation.gif 路徑，若不存在會顯示替代畫面。
// 可修改的題目設定集中在 optionData、correctOrder 與 questionText，方便替換題目內容。
// 本檔案只使用 p5.js 內建 API，不需要另外安裝外部框架或套件。

let animationGif; // 儲存 preload 載入的 GIF 圖片物件。
let imageLoaded = false; // 記錄 GIF 是否成功載入。
let imageFailed = false; // 記錄 GIF 是否載入失敗。
let optionData = []; // 儲存六個可拖曳的選項資料。
let answerOrder = []; // 儲存目前答案區中的選項順序。
let poolOrder = []; // 儲存目前尚未放入答案區的選項順序。
let draggingCard = null; // 儲存目前正在被拖曳的選項物件。
let dragOffsetX = 0; // 儲存拖曳起點與選項左側的水平差值。
let dragOffsetY = 0; // 儲存拖曳起點與選項上方的垂直差值。
let submitted = false; // 記錄使用者是否已經按下交卷按鈕。
let score = 0; // 儲存答對的題數。
let confetti = []; // 儲存成績達標後的彩帶物件。
let layout = {}; // 儲存每次繪圖時重新計算的響應式版面資料。
let suppressMouseUntil = 0; // 避免觸控事件結束後被瀏覽器重複觸發滑鼠事件。
let questionText = "請將下列 p5.js 片段排列成合理的程式結構，完成後按下交卷看成績。"; // 顯示本題說明文字。
let correctOrder = [0, 1, 2, 3, 4, 5]; // 設定六個選項的正確順序索引，索引從零開始。

function preload() { // 在畫面建立前預先載入 GIF 圖片。
  animationGif = loadImage("assets/p5-animation.gif", onImageLoaded, onImageFailed); // 載入指定路徑並設定成功與失敗回呼函式。
} // 結束 preload 函式。

function onImageLoaded() { // 處理 GIF 成功載入的事件。
  imageLoaded = true; // 將成功載入旗標設為真。
} // 結束圖片成功回呼函式。

function onImageFailed() { // 處理 GIF 載入失敗的事件。
  imageFailed = true; // 將載入失敗旗標設為真，讓畫面改用替代顯示。
} // 結束圖片失敗回呼函式。

function setup() { // 建立畫布並初始化測驗資料。
  createCanvas(windowWidth, windowHeight); // 建立符合瀏覽器視窗大小的全螢幕畫布。
  textFont("sans-serif"); // 使用瀏覽器普遍支援的無襯線字型。
  textAlign(LEFT, CENTER); // 設定一般文字預設靠左並垂直置中。
  rectMode(CORNER); // 使用左上角座標作為矩形繪製基準。
  initializeQuiz(); // 建立選項資料並將所有選項放入待選區。
} // 結束 setup 函式。

function initializeQuiz() { // 初始化或重新初始化整份測驗。
  optionData = [ // 建立六個具有識別編號與程式片段的選項。
    { id: 0, label: "A", text: "function setup() { createCanvas(400, 400); }" }, // 建立畫布的 setup 片段。
    { id: 1, label: "B", text: "function draw() {" }, // 開始每一幀重複執行的 draw 片段。
    { id: 2, label: "C", text: "background(220);" }, // 清除畫布並繪製背景的片段。
    { id: 3, label: "D", text: "fill(255, 0, 0);" }, // 設定下一個圖形填色的片段。
    { id: 4, label: "E", text: "ellipse(mouseX, mouseY, 50, 50);" }, // 在滑鼠位置繪製圓形的片段。
    { id: 5, label: "F", text: "}  // draw 結束" } // 結束 draw 函式的片段。
  ]; // 完成六個選項資料的建立。
  answerOrder = []; // 清空答案區，讓重新測驗回到未作答狀態。
  poolOrder = optionData.map(function(card) { return card.id; }); // 將六個選項的編號全部放入待選區。
  draggingCard = null; // 清除可能殘留的拖曳物件。
  submitted = false; // 重新測驗時隱藏成績與正誤提示。
  score = 0; // 將答對題數歸零。
  confetti = []; // 清除上一次測驗的彩帶。
} // 結束測驗初始化函式。

function draw() { // 每一幀重新繪製整個測驗介面。
  calculateLayout(); // 根據目前畫布尺寸重新計算所有版面位置。
  background(244, 247, 251); // 填滿柔和的背景色，讓內容容易閱讀。
  drawHeader(); // 繪製標題與題目說明。
  drawGifPanel(); // 繪製上方 GIF 或載入失敗時的替代畫面。
  drawAnswerZone(); // 繪製 GIF 下方的答案排序區。
  drawPoolZone(); // 繪製尚未放入答案區的選項。
  if (draggingCard) { drawDraggingCard(); } // 將拖曳中的卡片最後繪製，確保它位於所有卡片上方。
  drawButtons(); // 繪製交卷或重新測驗按鈕。
  drawResult(); // 只有交卷後才繪製成績與正誤資訊。
  if (submitted && score / correctOrder.length > 0.6) { // 判斷交卷後成績是否高於百分之六十。
    drawConfetti(); // 成績達標時繪製持續飄落的彩帶動畫。
  } // 結束達標彩帶判斷。
} // 結束 draw 函式。

function calculateLayout() { // 依照手機或桌面尺寸建立響應式版面。
  let margin = constrain(width * 0.04, 12, 34); // 讓左右邊界隨畫面寬度改變但保留合理範圍。
  let contentWidth = width - margin * 2; // 計算內容可使用的寬度。
  let compact = height < 680 || width < 400; // 判斷是否需要使用手機小螢幕的緊湊版面。
  let titleHeight = compact ? 72 : 68; // 小螢幕保留標題空間，大螢幕則使用一般高度。
  let gifHeight = compact ? constrain(height * 0.13, 78, 120) : constrain(height * 0.19, 112, 218); // 讓 GIF 區域依視窗高度響應式縮放。
  let columns = width < 600 ? 2 : 3; // 手機採兩欄，桌面採三欄以維持觸控尺寸。
  let gaps = columns - 1; // 計算同一列中卡片之間的間隔數量。
  let cardGap = constrain(contentWidth * 0.018, compact ? 5 : 7, compact ? 8 : 14); // 設定卡片之間的響應式間隔。
  let cardWidth = (contentWidth - gaps * cardGap) / columns; // 計算每張選項卡片的寬度。
  let rows = Math.ceil(optionData.length / columns); // 計算最多需要幾列才能放下六張卡片。
  let sectionGap = compact ? 24 : 38; // 設定 GIF、答案區與待選區之間的響應式間隔。
  let buttonGap = compact ? 10 : 16; // 設定待選區與按鈕之間的響應式間隔。
  let resultSpace = compact ? 52 : 70; // 預留交卷後兩行成績文字的空間。
  let fixedHeight = margin * 2 + titleHeight + gifHeight + sectionGap * 2 + buttonGap + 46 + resultSpace; // 計算卡片以外的必要高度。
  let cardHeight = constrain((height - fixedHeight - 36 - (rows - 1) * cardGap * 2) / (rows * 2), compact ? 28 : 36, compact ? 58 : 70); // 依剩餘高度計算兩個區域共用的卡片高度。
  let zoneHeight = rows * cardHeight + (rows - 1) * cardGap + 18; // 預留答案區與待選區的卡片空間。
  let titleY = margin; // 設定標題區的垂直起點。
  let gifY = titleY + titleHeight; // 設定 GIF 區域的垂直起點。
  let answerY = gifY + gifHeight + sectionGap; // 設定答案區的垂直起點。
  let poolY = answerY + zoneHeight + sectionGap; // 設定待選區的垂直起點。
  let buttonY = poolY + zoneHeight + buttonGap; // 設定按鈕區的垂直起點。
  layout = { margin: margin, contentWidth: contentWidth, titleY: titleY, titleHeight: titleHeight, gif: { x: margin, y: gifY, w: contentWidth, h: gifHeight }, answer: { x: margin, y: answerY, w: contentWidth, h: zoneHeight }, pool: { x: margin, y: poolY, w: contentWidth, h: zoneHeight }, buttonY: buttonY, columns: columns, cardGap: cardGap, cardWidth: cardWidth, cardHeight: cardHeight }; // 儲存所有計算結果供其他繪圖函式使用。
} // 結束版面計算函式。

function drawHeader() { // 繪製測驗標題與題目說明。
  fill(29, 43,  seventyFive()); // 使用深色文字以保持良好對比。
  noStroke(); // 移除標題文字不需要的外框。
  textAlign(LEFT, TOP); // 讓標題與說明從左上角開始排列。
  textSize(constrain(width * 0.045, 22, 34)); // 依螢幕寬度自動縮放主標題大小。
  text("p5.js 程式片段排序挑戰", layout.margin, layout.titleY); // 顯示測驗主標題。
  fill(74, 87, 105); // 使用較柔和的顏色顯示題目說明。
  textSize(constrain(width * 0.022, 13, 18)); // 依螢幕寬度自動縮放說明文字大小。
  text(questionText, layout.margin, layout.titleY + 42, layout.contentWidth, layout.titleHeight - 42); // 在標題下方顯示本題操作說明。
  textAlign(LEFT, CENTER); // 還原一般元件使用的文字對齊方式。
} // 結束標題繪製函式。

function seventyFive() { // 提供固定的深色藍灰色數值，避免在程式中散落魔術數字。
  return 75; // 回傳藍色通道數值。
} // 結束色彩輔助函式。

function drawGifPanel() { // 繪製上方動畫 GIF 顯示區。
  let box = layout.gif; // 取得 GIF 區域的版面資料。
  fill(255); // 使用白色作為圖片卡片背景。
  stroke(221, 228, 238); // 使用淡色外框區分內容區域。
  strokeWeight(1); // 設定外框粗細。
  rect(box.x, box.y, box.w, box.h, 16); // 繪製圓角圖片容器。
  if (imageLoaded && animationGif) { // 判斷 GIF 是否可用且物件存在。
    imageMode(CENTER); // 讓圖片以中央點作為繪製基準。
    let scaleValue = min((box.w - 20) / animationGif.width, (box.h - 20) / animationGif.height); // 計算圖片保持比例所需的縮放值。
    let drawWidth = animationGif.width * scaleValue; // 計算 GIF 繪製寬度。
    let drawHeight = animationGif.height * scaleValue; // 計算 GIF 繪製高度。
    image(animationGif, box.x + box.w / 2, box.y + box.h / 2, drawWidth, drawHeight); // 將動畫 GIF 繪製在容器中央。
    imageMode(CORNER); // 還原圖片模式供後續繪圖使用。
  } else { // 當 GIF 尚未完成載入或檔案不存在時顯示替代畫面。
    drawGifFallback(box); // 顯示不會造成程式崩潰的替代動畫圖樣。
  } // 結束 GIF 顯示判斷。
} // 結束 GIF 區域繪製函式。

function drawGifFallback(box) { // 繪製 GIF 失敗時的替代顯示內容。
  noStroke(); // 移除替代圖樣的不必要外框。
  fill(232, 240, 255); // 填入淡藍色替代背景。
  rect(box.x + 12, box.y + 12, box.w - 24, box.h - 24, 12); // 繪製內層替代背景。
  let centerX = box.x + box.w / 2; // 計算替代動畫中心的水平座標。
  let centerY = box.y + box.h / 2; // 計算替代動畫中心的垂直座標。
  let pulse = 1 + sin(frameCount * 0.06) * 0.08; // 讓替代圓形產生簡單的脈動動畫。
  fill(68, 126, 220, 55); // 設定外層脈動圓的半透明顏色。
  circle(centerX, centerY, min(box.w, box.h) * 0.48 * pulse); // 繪製外層脈動圓形。
  fill(68, 126, 220); // 設定內層圓形顏色。
  circle(centerX, centerY, min(box.w, box.h) * 0.23); // 繪製內層圓形。
  fill(42, 62, 92); // 設定替代文字顏色。
  textAlign(CENTER, CENTER); // 讓替代文字置中顯示。
  textSize(constrain(width * 0.02, 12, 17)); // 依畫面寬度設定替代文字大小。
  text(imageFailed ? "找不到 GIF，這裡使用替代動畫" : "GIF 載入中…", centerX, box.y + box.h - 25); // 顯示載入中或找不到檔案的提示。
  textAlign(LEFT, CENTER); // 還原一般文字對齊方式。
} // 結束 GIF 替代畫面函式。

function drawAnswerZone() { // 繪製可重新排序的答案區。
  drawZoneFrame(layout.answer, "答案區：請把選項拖到這裡並排序"); // 繪製答案區外框與標題。
  drawCards(answerOrder, layout.answer); // 依目前答案順序繪製答案區中的選項。
  if (answerOrder.length === 0) { // 判斷答案區是否尚未放入任何選項。
    drawEmptyHint(layout.answer, "將六個選項拖曳到這裡"); // 顯示操作提示，協助使用者理解拖曳目標。
  } // 結束空答案區判斷。
} // 結束答案區繪製函式。

function drawPoolZone() { // 繪製尚未作答的選項區。
  drawZoneFrame(layout.pool, "選項區：從這裡拖曳程式片段"); // 繪製待選區外框與標題。
  drawCards(poolOrder, layout.pool); // 依目前待選順序繪製尚未放入答案區的卡片。
  if (poolOrder.length === 0) { // 判斷待選區是否已經沒有剩餘選項。
    drawEmptyHint(layout.pool, "所有選項都已放入答案區"); // 顯示待選區已清空的提示。
  } // 結束空待選區判斷。
} // 結束待選區繪製函式。

function drawZoneFrame(zone, title) { // 繪製答案區或待選區的共同外觀。
  noStroke(); // 移除區域外框前的舊外框設定。
  fill(238, 243, 249); // 使用淺灰藍色填滿區域背景。
  rect(zone.x, zone.y, zone.w, zone.h, 14); // 繪製圓角區域背景。
  fill(42, 62, 92); // 設定區域標題的深色文字。
  textAlign(LEFT, BOTTOM); // 讓區域標題對齊左下方。
  textSize(constrain(width * 0.022, 14, 18)); // 依寬度設定區域標題大小。
  text(title, zone.x, zone.y - 9); // 在區域上方顯示標題。
  textAlign(LEFT, CENTER); // 還原卡片文字使用的對齊方式。
} // 結束區域外框函式。

function drawCards(order, zone) { // 依照指定順序計算並繪製卡片。
  for (let i = 0; i < order.length; i += 1) { // 逐一處理該區域中的每個選項編號。
    let card = getCardById(order[i]); // 依編號取得對應的選項物件。
    if (!card || card === draggingCard) { continue; } // 拖曳中的卡片改由 drawDraggingCard 單獨繪製。
    let position = getCardPosition(i, zone); // 計算卡片在網格中的位置。
    card.x = position.x; // 更新卡片的水平位置供碰撞判斷使用。
    card.y = position.y; // 更新卡片的垂直位置供碰撞判斷使用。
    card.w = layout.cardWidth; // 更新卡片寬度供碰撞判斷使用。
    card.h = layout.cardHeight; // 更新卡片高度供碰撞判斷使用。
    drawCard(card); // 繪製單張選項卡片。
  } // 結束所有卡片的逐一繪製。
} // 結束卡片清單繪製函式。

function getCardPosition(index, zone) { // 計算網格中第幾張卡片的座標。
  let column = index % layout.columns; // 計算卡片所在欄位。
  let row = Math.floor(index / layout.columns); // 計算卡片所在列數。
  let x = zone.x + 9 + column * (layout.cardWidth + layout.cardGap); // 計算卡片左側座標。
  let y = zone.y + 9 + row * (layout.cardHeight + layout.cardGap); // 計算卡片上方座標。
  return { x: x, y: y }; // 回傳卡片的座標物件。
} // 結束卡片座標計算函式。

function drawCard(card) { // 繪製單張可拖曳選項卡片。
  let cardFill = color(255); // 設定一般卡片的預設背景色。
  let cardStroke = color(186, 199, 219); // 設定一般卡片的預設外框色。
  if (submitted && card.id === correctOrder[card.currentAnswerIndex]) { cardFill = color(222, 248, 230); cardStroke = color(48, 160, 88); } // 交卷後將正確位置標示為綠色。
  if (submitted && card.id !== correctOrder[card.currentAnswerIndex]) { cardFill = color(255, 231, 231); cardStroke = color(210, 78, 78); } // 交卷後將錯誤位置標示為紅色。
  fill(cardFill); // 套用卡片背景色。
  stroke(cardStroke); // 套用卡片外框色。
  strokeWeight(2); // 設定卡片外框粗細。
  rect(card.x, card.y, card.w, card.h, 10); // 繪製圓角卡片。
  fill(55, 92, 165); // 設定選項字母標籤背景色。
  noStroke(); // 移除字母標籤的外框。
  circle(card.x + 22, card.y + card.h / 2, min(30, card.h * 0.56)); // 繪製選項字母圓形標籤。
  fill(255); // 設定字母標籤文字為白色。
  textAlign(CENTER, CENTER); // 將選項字母置中。
  textSize(constrain(card.h * 0.25, 11, 16)); // 依卡片高度縮放字母大小。
  text(card.label, card.x + 22, card.y + card.h / 2 + 1); // 顯示選項字母。
  fill(43, 53, 68); // 設定程式片段文字顏色。
  textAlign(LEFT, CENTER); // 將程式片段文字靠左排列。
  textSize(constrain(card.h * 0.235, 10, 16)); // 依卡片高度縮放程式文字大小。
  text(card.text, card.x + 43, card.y + card.h / 2, card.w - 52, card.h - 10); // 顯示可辨識的 p5.js 程式片段。
  textAlign(LEFT, CENTER); // 還原一般繪圖的文字對齊方式。
} // 結束單張卡片繪製函式。

function drawDraggingCard() { // 繪製跟隨滑鼠或手指移動的卡片。
  drawingCardShadow(draggingCard); // 繪製拖曳時的陰影，增加浮起效果。
  drawCard(draggingCard); // 使用一般卡片函式繪製拖曳中的卡片。
} // 結束拖曳卡片繪製函式。

function drawingCardShadow(card) { // 繪製拖曳卡片的柔和陰影。
  drawingContext.save(); // 暫存目前 Canvas 繪圖狀態。
  drawingContext.shadowColor = "rgba(30, 55, 90, 0.25)"; // 設定陰影顏色。
  drawingContext.shadowBlur = 14; // 設定陰影模糊程度。
  drawingContext.shadowOffsetY = 6; // 設定陰影向下偏移量。
  noFill(); // 不填滿陰影專用的矩形。
  stroke(255, 255, 255, 0); // 使用透明外框觸發陰影效果。
  rect(card.x, card.y, card.w, card.h, 10); // 繪製陰影範圍。
  drawingContext.restore(); // 還原 Canvas 繪圖狀態。
} // 結束卡片陰影函式。

function drawEmptyHint(zone, message) { // 繪製空區域的操作提示。
  fill(119, 134, 154); // 設定提示文字顏色。
  noStroke(); // 移除提示文字不需要的外框。
  textAlign(CENTER, CENTER); // 將提示文字置中顯示。
  textSize(constrain(width * 0.022, 13, 17)); // 依畫面寬度縮放提示文字。
  text(message, zone.x + zone.w / 2, zone.y + zone.h / 2); // 顯示空區域提示。
  textAlign(LEFT, CENTER); // 還原一般文字對齊方式。
} // 結束空區域提示函式。

function drawButtons() { // 繪製交卷或重新測驗按鈕。
  let buttonWidth = constrain(width * 0.42, 180, 280); // 計算主要按鈕寬度並限制觸控友善尺寸。
  let buttonHeight = 46; // 設定按鈕高度以方便滑鼠與觸控操作。
  let buttonX = width / 2 - buttonWidth / 2; // 計算按鈕水平置中座標。
  let buttonY = min(layout.buttonY, height - buttonHeight - 14); // 確保按鈕在小螢幕中仍盡量留在畫布內。
  layout.submitButton = { x: buttonX, y: buttonY, w: buttonWidth, h: buttonHeight }; // 儲存按鈕碰撞區域。
  fill(submitted ? color(55, 133, 89) : color(55, 99, 184)); // 依狀態設定按鈕顏色。
  noStroke(); // 移除按鈕外框。
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 12); // 繪製圓角按鈕。
  fill(255); // 設定按鈕文字為白色。
  textAlign(CENTER, CENTER); // 將按鈕文字置中。
  textSize(constrain(width * 0.025, 15, 19)); // 依畫面寬度調整按鈕文字大小。
  text(submitted ? "重新測驗" : "交卷看成績", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2); // 顯示目前狀態對應的按鈕文字。
  textAlign(LEFT, CENTER); // 還原一般文字對齊方式。
} // 結束按鈕繪製函式。

function drawResult() { // 繪製交卷後的成績區域。
  if (!submitted) { return; } // 尚未交卷時直接返回，確保不提前顯示成績或對錯。
  let percentage = Math.round(score / correctOrder.length * 100); // 計算四捨五入後的百分比。
  let resultY = min(layout.submitButton.y + layout.submitButton.h + 25, height - 42); // 計算成績文字垂直位置並避免小螢幕超出畫布。
  fill(42, 62, 92); // 設定成績文字顏色。
  noStroke(); // 移除成績文字外框。
  textAlign(CENTER, CENTER); // 將成績文字置中。
  textSize(constrain(width * 0.035, 18, 26)); // 依畫面寬度縮放成績文字。
  text("總分：" + score + " / " + correctOrder.length + "　百分比：" + percentage + "%", width / 2, resultY); // 顯示總分與百分比。
  textSize(constrain(width * 0.022, 13, 17)); // 將第二行提示文字縮小。
  text(percentage > 60 ? "表現很好！彩帶正在為你慶祝。" : "再試一次，重新整理 p5.js 程式結構吧！", width / 2, resultY + 30); // 顯示達標或鼓勵訊息。
  textAlign(LEFT, CENTER); // 還原一般文字對齊方式。
} // 結束成績繪製函式。

function beginDrag(pointerX, pointerY) { // 開始處理滑鼠或觸控拖曳。
  if (submitted) { return; } // 交卷後禁止繼續修改答案順序。
  calculateLayout(); // 開始拖曳前更新一次版面，確保碰撞位置正確。
  let picked = findCardAt(pointerX, pointerY); // 找出指標下方最上層的選項卡片。
  if (!picked) { return; } // 沒有點到選項時不進行拖曳。
  removeCardFromOrders(picked.id); // 將卡片從原本的清單暫時移除，方便重新插入。
  draggingCard = picked; // 設定目前正在拖曳的卡片。
  dragOffsetX = pointerX - picked.x; // 記錄指標與卡片左側的水平差值。
  dragOffsetY = pointerY - picked.y; // 記錄指標與卡片上方的垂直差值。
  picked.w = layout.cardWidth; // 確保拖曳卡片寬度與目前版面一致。
  picked.h = layout.cardHeight; // 確保拖曳卡片高度與目前版面一致。
} // 結束開始拖曳函式。

function moveDrag(pointerX, pointerY) { // 更新拖曳卡片的位置。
  if (!draggingCard || submitted) { return; } // 沒有拖曳物件或已交卷時不更新位置。
  draggingCard.x = constrain(pointerX - dragOffsetX, 0, width - draggingCard.w); // 依指標水平座標移動卡片。
  draggingCard.y = constrain(pointerY - dragOffsetY, 0, height - draggingCard.h); // 依指標垂直座標移動卡片。
} // 結束拖曳移動函式。

function endDrag(pointerX, pointerY) { // 結束拖曳並依放置位置重新排序。
  if (!draggingCard) { return false; } // 沒有拖曳物件時不處理放置。
  moveDrag(pointerX, pointerY); // 在放開的最後一刻同步卡片位置。
  let releasedCard = draggingCard; // 暫存放開的卡片物件。
  draggingCard = null; // 清除拖曳狀態，讓版面重新排版。
  if (isInside(pointerX, pointerY, layout.answer)) { // 判斷是否放在答案區內。
    let targetIndex = getAnswerInsertIndex(pointerX, pointerY); // 計算答案區中最接近的插入位置。
    answerOrder.splice(targetIndex, 0, releasedCard.id); // 將卡片插入計算出的答案順序位置。
  } else { // 放在答案區以外時退回待選區。
    poolOrder.push(releasedCard.id); // 將卡片放回待選區的最後面。
  } // 結束放置區域判斷。
  return true; // 回傳已完成拖曳，避免同一次事件誤觸按鈕。
} // 結束拖曳放置函式。

function getAnswerInsertIndex(pointerX, pointerY) { // 計算卡片在答案區應該插入的索引。
  calculateLayout(); // 重新計算剩餘卡片的最新網格位置。
  for (let i = 0; i < answerOrder.length; i += 1) { // 逐一檢查答案區中的現有卡片。
    let position = getCardPosition(i, layout.answer); // 取得現有卡片的網格位置。
    let centerX = position.x + layout.cardWidth / 2; // 計算現有卡片中心的水平座標。
    let centerY = position.y + layout.cardHeight / 2; // 計算現有卡片中心的垂直座標。
    if (pointerY < centerY || (abs(pointerY - centerY) < layout.cardHeight / 2 && pointerX < centerX)) { return i; } // 指標在卡片前方時插入卡片之前。
  } // 結束現有卡片位置檢查。
  return answerOrder.length; // 若沒有更前方的卡片則插入答案清單尾端。
} // 結束答案插入索引計算函式。

function findCardAt(pointerX, pointerY) { // 找出指標目前碰到的卡片。
  let allIds = answerOrder.concat(poolOrder); // 合併答案區與待選區的所有卡片編號。
  for (let i = allIds.length - 1; i >= 0; i -= 1) { // 從最後面開始檢查，確保最上層卡片優先。
    let card = getCardById(allIds[i]); // 依編號取得卡片物件。
    if (card && isInside(pointerX, pointerY, card)) { return card; } // 指標位於卡片內時回傳該卡片。
  } // 結束所有卡片碰撞檢查。
  return null; // 沒有碰到卡片時回傳空值。
} // 結束卡片尋找函式。

function getCardById(id) { // 依照選項編號取得卡片資料。
  for (let i = 0; i < optionData.length; i += 1) { // 逐一搜尋六個選項。
    if (optionData[i].id === id) { return optionData[i]; } // 找到相同編號時回傳該卡片。
  } // 結束卡片搜尋迴圈。
  return null; // 找不到指定編號時回傳空值。
} // 結束卡片取得函式。

function removeCardFromOrders(id) { // 將指定卡片從答案區與待選區移除。
  answerOrder = answerOrder.filter(function(cardId) { return cardId !== id; }); // 從答案順序中移除指定卡片。
  poolOrder = poolOrder.filter(function(cardId) { return cardId !== id; }); // 從待選順序中移除指定卡片。
} // 結束卡片清單移除函式。

function isInside(pointerX, pointerY, box) { // 判斷指標是否位於指定矩形範圍內。
  return pointerX >= box.x && pointerX <= box.x + box.w && pointerY >= box.y && pointerY <= box.y + box.h; // 回傳矩形碰撞結果。
} // 結束矩形碰撞判斷函式。

function submitQuiz() { // 計算成績並顯示結果。
  if (submitted) { return; } // 避免重複交卷造成不必要的重新計算。
  submitted = true; // 設定已交卷狀態，解除成績隱藏。
  score = 0; // 先將本次答對題數歸零。
  for (let i = 0; i < correctOrder.length; i += 1) { // 逐一比較答案區的每個位置。
    let currentId = answerOrder[i]; // 取得目前位置的選項編號。
    let card = getCardById(currentId); // 取得目前位置的卡片物件。
    if (currentId === correctOrder[i]) { score += 1; } // 選項編號與正確順序相同時增加一分。
    if (card) { card.currentAnswerIndex = i; } // 記錄卡片交卷時所在位置供顯色使用。
  } // 結束所有答案位置的評分。
  for (let i = 0; i < poolOrder.length; i += 1) { // 處理仍留在待選區的卡片。
    let card = getCardById(poolOrder[i]); // 取得待選區中的卡片物件。
    if (card) { card.currentAnswerIndex = -1; } // 未放入答案區的選項標示為未作答位置。
  } // 結束待選卡片標記。
  if (score / correctOrder.length > 0.6) { createConfetti(); } // 成績高於百分之六十時建立彩帶資料。
} // 結束交卷評分函式。

function resetQuiz() { // 重新開始一份全新的測驗。
  initializeQuiz(); // 重設所有選項、成績、彩帶與交卷狀態。
} // 結束重新測驗函式。

function createConfetti() { // 建立彩帶動畫所需的物件陣列。
  confetti = []; // 清空舊彩帶，避免重新測驗後保留舊動畫。
  for (let i = 0; i < 130; i += 1) { // 建立足夠數量的彩帶以形成慶祝效果。
    confetti.push({ x: random(width), y: random(-height, 0), size: random(5, 11), speed: random(2, 5), drift: random(-1.4, 1.4), angle: random(TWO_PI), spin: random(-0.12, 0.12), color: color(random(50, 255), random(70, 220), random(80, 255)) }); // 建立單個具有位置、速度與顏色的彩帶。
  } // 結束彩帶物件建立迴圈。
} // 結束彩帶建立函式。

function drawConfetti() { // 更新並繪製達標後的彩帶動畫。
  for (let i = 0; i < confetti.length; i += 1) { // 逐一更新每一片彩帶。
    let piece = confetti[i]; // 取得目前彩帶物件。
    piece.y += piece.speed; // 讓彩帶向下飄落。
    piece.x += piece.drift + sin(frameCount * 0.03 + i) * 0.35; // 讓彩帶左右輕微飄動。
    piece.angle += piece.spin; // 更新彩帶旋轉角度。
    if (piece.y > height + 20) { piece.y = random(-80, -10); piece.x = random(width); } // 飛出畫面底部時從上方重新出現。
    push(); // 暫存目前繪圖狀態。
    translate(piece.x, piece.y); // 將座標移到目前彩帶位置。
    rotate(piece.angle); // 旋轉彩帶以增加動態感。
    noStroke(); // 移除彩帶外框。
    fill(piece.color); // 套用每片彩帶的隨機顏色。
    rectMode(CENTER); // 讓彩帶矩形以中心點繪製。
    rect(0, 0, piece.size, piece.size * 2.4, 2); // 繪製細長彩帶形狀。
    rectMode(CORNER); // 還原一般矩形模式。
    pop(); // 還原繪圖狀態。
  } // 結束所有彩帶的更新與繪製。
} // 結束彩帶動畫函式。

function mousePressed() { // 處理滑鼠按下事件。
  if (millis() < suppressMouseUntil) { return false; } // 觸控剛結束時忽略瀏覽器補發的滑鼠事件。
  beginDrag(mouseX, mouseY); // 使用滑鼠座標開始拖曳。
  return false; // 阻止瀏覽器預設選取行為。
} // 結束滑鼠按下事件。

function mouseDragged() { // 處理滑鼠拖曳事件。
  if (millis() < suppressMouseUntil) { return false; } // 觸控模擬滑鼠期間忽略重複拖曳。
  moveDrag(mouseX, mouseY); // 使用滑鼠座標更新卡片位置。
  return false; // 阻止瀏覽器預設拖曳行為。
} // 結束滑鼠拖曳事件。

function mouseReleased() { // 處理滑鼠放開事件。
  if (millis() < suppressMouseUntil) { return false; } // 觸控模擬滑鼠期間忽略重複放開。
  if (endDrag(mouseX, mouseY)) { return false; } // 若剛完成拖曳就不觸發按鈕點擊。
  handleButtonClick(mouseX, mouseY); // 沒有拖曳時檢查是否按下按鈕。
  return false; // 阻止瀏覽器預設點擊行為。
} // 結束滑鼠放開事件。

function touchStarted() { // 處理手機或平板觸控開始事件。
  suppressMouseUntil = millis() + 500; // 暫時忽略觸控後可能產生的滑鼠事件。
  let point = getTouchPoint(); // 取得第一個觸控點座標。
  beginDrag(point.x, point.y); // 使用觸控點開始拖曳。
  return false; // 阻止頁面跟著觸控捲動。
} // 結束觸控開始事件。

function touchMoved() { // 處理手機或平板觸控移動事件。
  let point = getTouchPoint(); // 取得第一個觸控點座標。
  moveDrag(point.x, point.y); // 使用觸控點更新卡片位置。
  return false; // 阻止頁面跟著手指捲動。
} // 結束觸控移動事件。

function touchEnded() { // 處理手機或平板觸控結束事件。
  let point = getTouchPoint(); // 取得最後一個可用觸控點座標。
  if (endDrag(point.x, point.y)) { return false; } // 若剛完成拖曳就不觸發按鈕點擊。
  handleButtonClick(point.x, point.y); // 沒有拖曳時檢查是否按下按鈕。
  return false; // 阻止瀏覽器預設觸控行為。
} // 結束觸控結束事件。

function getTouchPoint() { // 取得目前第一個觸控點或滑鼠位置。
  if (touches && touches.length > 0) { return { x: touches[0].x, y: touches[0].y }; } // 優先回傳 p5.js 提供的第一個觸控點。
  return { x: mouseX, y: mouseY }; // 沒有觸控點時回傳目前滑鼠位置作為備援。
} // 結束觸控座標取得函式。

function handleButtonClick(pointerX, pointerY) { // 處理交卷與重新測驗按鈕點擊。
  if (!layout.submitButton || !isInside(pointerX, pointerY, layout.submitButton)) { return; } // 指標不在按鈕內時不做任何事。
  if (submitted) { resetQuiz(); } else { submitQuiz(); } // 依目前狀態執行交卷或重新測驗。
} // 結束按鈕點擊處理函式。

function windowResized() { // 處理瀏覽器視窗大小改變事件。
  resizeCanvas(windowWidth, windowHeight); // 將畫布調整為新的全螢幕尺寸。
  calculateLayout(); // 立即重新計算響應式版面。
} // 結束視窗尺寸變更函式。
