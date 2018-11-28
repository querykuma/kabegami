/*!
 * kabegami v1.0
 * https://github.com/querykuma/kabegami
 *
 * Copyright 2018-present Query Kuma
 * Released under the MIT license
 *
 * Date: 2018-11-28
 */

$(function () {
	'use strict';

	class FirstStep {
		constructor() {
			this.googleChromeFix();
		}
		googleChromeFix() {
			/*Google Chromeがローカル環境でlinkタグのスタイルシートのcssRulesにアクセスできなかった*/
			let found = this.findLocalStyle("span.img");
			if (!found) {
				let style = document.createElement('STYLE');
				document.head.append(style);
				style.textContent = "span.img{temp: 1;}";
			}
		}
		findLocalStyle(selectorText) {
			let found = [], i = 0;
			for (let sheet of document.styleSheets) {
				if (sheet.ownerNode.tagName.toUpperCase() === 'STYLE') {
					for (let rule of sheet.cssRules) {
						if (rule.selectorText === selectorText) {
							found.push({ num: i, rule: rule });
						}
					}
				}
				i++;
			}
			return found.length === 0 ? false : found;
		}
	}

	//MyContextMenu.inNode()でマウスの座標を使う
	class Mouse {
		constructor() {
			$(window).mousemove(this.mousemove.bind(this));
		}
		mousemove(e) {
			this.e = {
				pageX: e.pageX,
				pageY: e.pageY/*,
				offsetX: e.offsetX,
				offsetY: e.offsetY,
				clientX: e.clientX,
				clientY: e.clientY,
				screenX: e.screenX,
				screenY: e.screenY*/
			};
		}
	}

	//右クリックのmouseoverメニューを一定時間後に閉じる為の配列
	class Controls {
		constructor() {
			this.controls = [];
		}
		debug() {
			let str = JSON.stringify(this.controls.map(a =>
				[a[0] ? a[0].id : '', a[1], a[2], typeof a[3] === 'function' ? 'f' : '']));
			$(debug).html(str + "<br>" + $(debug).html());
		}
		push(c) {
			let [el, show, timer, delayed] = c;
			if (el instanceof jQuery) {
				el = el[0];
			}
			c = [el, show, timer, delayed];
			this.controls.push(c);
		};
		handle() {
			if (!this instanceof Controls) console.error("class name is " + this.constructor.name);
			let c;
			while (c = this.controls.shift()) {
				let [el, show, timer, delayed] = c;
				if (delayed) {
					delayed();
				} else {
					if (show) {
						$(el).addClass('show');
					} else {
						$(el).removeClass('show');
					}
				}
			}
		};
		remove(el_rm) {
			let remove_all = false;
			if (typeof el_rm === "object" && el_rm.hasOwnProperty("remove_all")) {
				remove_all = el_rm.remove_all;
			}
			if (el_rm instanceof jQuery) {
				el_rm = el_rm[0];
			}
			this.controls = this.controls.filter(c => {
				let [el, show, timer, delayed] = c;
				if (el === el_rm || remove_all) {
					clearTimeout(timer);
					return false;
				} else {
					return true;
				}
			});
		};
	}

	//背景画像の左右矢印による切り替え
	class BgImage {
		constructor(images, contextmenu, mpcm2) {
			this.autoplayinterval = 3000;
			this.contextmenu = contextmenu;
			this.mcmm = contextmenu.manager;
			this.mpcm2 = mpcm2;
			this.selectMode = false;
			for (let i of images) {
				let span = $('<span>').attr({ class: "img", src: i, title: i, tabindex: "0" }).css("background-image", `url(${i})`).appendTo(popimages);
				span.click(e => {
					this.clickImage(e);
				});
				span.contextmenu(e => {
					return this.oncontextMenu(e); /*return falseで右クリックメニューを出さない */
				});
			}
			this.reflesh();
			this.setBackgroundImage(0);
			this.setCurrentIdx();
		}
		toggleDispMode() {
			let bs = $("span.img").css("background-size");
			switch (bs) {
				case "contain":
					this.mpcm2.changeCSS("span.img", { "background-size": "cover" });
					this.mpcm2.enableOtherMenusButMe(pop2menu3_2);
					break;
				case "cover":
					this.mpcm2.changeCSS("span.img", { "background-size": "contain" });
					this.mpcm2.enableOtherMenusButMe(pop2menu3_1);
					break;
				default:
					console.error("out of span.img background-size " + bs)
					break;
			}
		}
		updateFocus() {
			bgimage.images[bgimage.currentBgIdx].node.focus();
		}
		autoPlay(start, option) {
			if (start) {
				if (this.inplay && option && !option.setTimeout) return false;
				this.timer = setTimeout(function () {
					this.setNextImage(1);
					this.autoPlay(true, { setTimeout: true });
				}.bind(this), this.autoplayinterval);
				this.inplay = true;
			} else {
				clearTimeout(this.timer);
				delete this.inplay;
			}
		}
		removeCurrentImage() {
			let idx = this.currentBgIdx;
			let image = this.images[idx];
			if (!image) return;
			let node = image.node;
			$(node).addClass("checked");
			this.removeCheckedImages();
		}
		removeCheckedImages() {
			let selfDelete = this.images[this.currentBgIdx].node.classList.contains("checked");
			let i = this.currentBgIdx, j = 0;
			while (i >= 0) {
				if (this.images[i].node.classList.contains("checked")) j++;
				i--;
			}
			let nextIdx = this.currentBgIdx - j;
			let imgs = $(".checked", popimages);
			for (let img of imgs) {
				img.parentElement.removeChild(img);
			}
			this.reflesh();
			this.currentBgIdx = nextIdx;
			this.setNextImage(selfDelete ? 1 : 0);
			$(num_images).text(0);
			$(poptop).hide();
			this.selectMode = false;
		}
		setBackgroundImage(image) {
			switch (typeof image) {
				case "number": // image=0
					this.currentBgIdx = image;
					image = this.images[image].name;
					break;
				default:
					console.error("typeof image", image);
					return;
			}
			$(document.body).css("background-image", `url(${image})`);
		}
		oncontextMenu(e) {
			if (!this.selectMode) {
				this.rightClickedImage = e.target;
				this.mcmm.hideAllContextmenu();
				this.contextmenu.oncontextMenu(e);
			}
			return false;
		}
		checkSelectedImage() {
			let img = this.rightClickedImage;
			$(img).addClass("checked");
			$(num_images).text(1);
			$(poptop).css("display", "flex");
			this.selectMode = true;
		}
		clickImage(e) {
			if (this.selectMode) {
				let node = e.target;
				if ($(node).hasClass("checked")) {
					$(node).removeClass("checked");
				} else {
					$(node).addClass("checked");
				}
				let num = $(".checked", popimages).length;
				$(num_images).text(num);
				if (num === 0) {
					this.selectMode = false;
					$(poptop).hide();
				}
			} else {
				let file = this.getImageSrc(e.target);
				$('body').css('background-image', 'url(' + file + ')');
				this.setCurrentIdx(e.target);
				$(pop).hide();
				this.mcmm.hideAllContextmenu();
			}
		}
		getFileName(str) {
			return str.match(/^url\("(.*)"\)$/)[1];
		}
		setCurrentIdx(node) {
			if (node) {
				for (let i = 0; i < this.images.length; i++) {
					if (this.images[i].node === node) {
						this.currentBgIdx = i;
						return;
					}
				}
			} else {
				//最初だけ
				let filename = this.getFileName(document.body.style.backgroundImage);
				for (let i = 0; i < this.images.length; i++) {
					if (this.images[i].name === filename) {
						this.currentBgIdx = i;
						return;
					}
				}
			}
			return false;
		}
		reflesh() {
			let f = $(popimages).find('span.img');
			this.images = f.map(i => {
				let j = f[i];
				let name = j.getAttribute("src") || j.getAttribute("name");
				return { name: name, node: j };
			});
		}
		getIndex(filename) {
			for (let i = 0; i < this.images.length; i++) {
				if (this.images[i].name === filename) return i;
			}
			return false;
		}
		getImageSrc(node) {
			if (node.getAttribute("type")) {
				let bgimg = $(node).css("background-image");
				let data = bgimg.match(/^url\("(.*)"\)$/)[1]
				if (!data) console.error("data is not");
				return data;
			} else {
				let src = node.getAttribute("src");
				return src;
			}
		}
		setNextImage(direction) {
			let idx = this.currentBgIdx;
			if (this.images.length === 0) return false;
			idx = (idx + direction + this.images.length) % this.images.length;
			this.currentBgIdx = idx;
			let image = this.images[idx];
			let src = this.getImageSrc(image.node);
			$('body').css('background-image', 'url(' + src + ')');
			this.updateFocus();
		}
	}

	class SideArrows {
		constructor(bgimage) {
			$(r_arrow).on('click', function (e) {
				bgimage.setNextImage(1);
			});
			$(l_arrow).on('click', function (e) {
				bgimage.setNextImage(-1);
			});
			$(window).mousemove(function (e) {
				let mX = e.pageX;
				let mY = e.pageY;
				let win_width = $(window).width();
				let arrow_width = $(l_arrow).width();
				let l_disp = mX < arrow_width * 1.2;
				let r_disp = mX > win_width - arrow_width * 1.2;
				if (l_disp) $(l_arrow).css('display', 'block')
				else $(l_arrow).css('display', 'none');
				if (r_disp) $(r_arrow).css('display', 'block')
				else $(r_arrow).css('display', 'none');
			});
		}
	}

	class PopManage {
		constructor(mpcm2, bgimage, mcm) {
			this.bgimage = bgimage;
			this.mpcm2 = mpcm2;
			this.mcm = mcm;
			this.manager = mpcm2.manager;
			$(pop).click((e) => {
				this.manager.hideAllContextmenu();
				e.stopPropagation();
			});
			$(pop).contextmenu((e) => {
				this.manager.hideAllContextmenu();
				this.mpcm2.oncontextMenu(e);
				e.stopPropagation();
				return false;
			});
			$(popimages).keydown((e) => {
				switch (e.originalEvent.key) {
					case "PageUp"://スクロールバーを優先させる
						e.stopPropagation();
						break;
					case "PageDown"://スクロールバーを優先させる
						e.stopPropagation();
						break;
					default:
						break;
				}
			});
			$(window).keydown((e) => {
				switch (e.originalEvent.key) {
					case "Escape"://ESC ポップ画面を開閉
						if ($(pop).css("display") === "none") {
							$(pop).css('display', 'flex');
							$(popimages).focus();
							bgimage.updateFocus();
						} else {
							$(pop).hide();
						}
						break;
					case "Delete"://現在の背景画像を除外
						this.bgimage.removeCurrentImage();
						break;
					case "PageUp"://前の背景画像
					case "ArrowLeft":
						this.bgimage.setNextImage(-1);
						break;
					case "PageDown"://次の背景画像
					case "ArrowRight":
						this.bgimage.setNextImage(1);
						break;
					case "Enter"://タブフォーカスされたサムネ画像を選択
						if (e.target.classList.contains("img")) {
							e.target.click();
						}
						break;
					case "s"://自動表示を開始停止
						if (this.bgimage.inplay === true) {
							this.bgimage.autoPlay(false);
							this.mcm.enableOtherMenusButMe(menu3_2);
						} else {
							this.bgimage.autoPlay(true);
							this.mcm.enableOtherMenusButMe(menu3_1);
						}
						break;
					case "t"://表示方法を切り替え
						this.toggleDispModeWrap(e.target);
						break;
					default:
						break;
				}
			});
		}
		toggleDispMode() {
			let bs = $("body").css("background-size");
			switch (bs) {
				case "contain":
					$("body").css('background-size', "cover")
					this.mpcm2.enableOtherMenusButMe(menu2_1);
					break;
				case "cover":
					$("body").css('background-size', "contain")
					this.mpcm2.enableOtherMenusButMe(menu2_2);
					break;
				default:
					console.error("out of background-size " + bs)
					break;
			}
		}
		toggleDispModeWrap(elem) {
			if (!elem) {
				console.error("out of toggle parentElement");
				return;
			}
			switch (elem) {
				case popimages:
					this.bgimage.toggleDispMode();
					return;
				case document.body:
					this.toggleDispMode();
					return;
			}
			this.toggleDispModeWrap(elem.parentElement);
		}
	}

	const mycontextmenu = {
		mycontextmenu1: {
			firstmenu: true,
			menu1_1: {
				text: "背景画像を選択",
				click: function (e) {
					$(pop).css('display', 'flex');
				}
			},
			menu1_2: {
				text: "背景画像の表示方法",
				sub: "mycontextmenu2"
			},
			menu1_3: {
				text: "自動表示",
				sub: "mycontextmenu3"
			},
			menu1_4: {
				text: "自動表示の間隔",
				sub: "mycontextmenu4"
			}
		},
		mycontextmenu2: {
			menu2_1: {
				text: "画面を埋める",
				class: "disabled",
				click: function (e) {
					$("body").css('background-size', "cover")
					this.enableOtherMenusButMe(e);
				}
			},
			menu2_2: {
				text: "画像全体を表示",
				click: function (e) {
					$("body").css('background-size', "contain")
					this.enableOtherMenusButMe(e);
				}
			}
		},
		mycontextmenu3: {
			menu3_1: {
				text: "開始",
				click: function (e) {
					this.enableOtherMenusButMe(e);
					bgimage.autoPlay(true);
				}
			},
			menu3_2: {
				text: "停止",
				class: "disabled",
				click: function (e) {
					this.enableOtherMenusButMe(e);
					bgimage.autoPlay(false);
				}
			}
		},
		mycontextmenu4: {
			menu4_1: {
				text: "１秒",
				click: function (e) {
					bgimage.autoplayinterval = 1000;
					this.enableOtherMenusButMe(e);
				}
			},
			menu4_2: {
				text: "３秒",
				class: "disabled",
				click: function (e) {
					bgimage.autoplayinterval = 3000;
					this.enableOtherMenusButMe(e);
				}
			},
			menu4_3: {
				text: "１０秒",
				click: function (e) {
					bgimage.autoplayinterval = 10000;
					this.enableOtherMenusButMe(e);
				}
			}
		}
	};
	const mypopcontextmenu = {
		mypopcontextmenu1: {
			firstmenu: true,
			popmenu1: {
				text: "サムネ画像を除外",
				click: function (e) {
					bgimage.checkSelectedImage();
				}
			}
		}
	};
	const mypopcontextmenu2 = {
		mypopcontextmenu2_1: {
			firstmenu: true,
			pop2menu1_1: {
				text: "背景画像を選択の列数",
				sub: "mypopcontextmenu2_2"
			},
			pop2menu1_2: {
				text: "サムネ画像の表示方法",
				sub: "mypopcontextmenu2_3"
			},
			pop2menu1_3: {
				text: "背景画像のインポート",
				click: function (e) {
					files.click();
					bgimage.updateFocus();
				}
			}
		},
		mypopcontextmenu2_2: {
			pop2menu2_0: {
				text: "２列",
				click: function (e) {
					this.changeCSS("span.img", { width: "45%", height: "45%", margin: "calc(10%/4)" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
				}
			},
			pop2menu2_1: {
				text: "３列",
				click: function (e) {
					this.changeCSS("span.img", { width: "30%", height: "30%", margin: "calc(10%/6)" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
				}
			},
			pop2menu2_2: {
				text: "５列",
				click: function (e) {
					this.changeCSS("span.img", { width: "18%", height: "18%", margin: "calc(10%/10)" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
				}
			},
			pop2menu2_3: {
				text: "６列",
				class: "disabled",
				click: function (e) {
					this.changeCSS("span.img", { width: "15%", height: "15%", margin: "calc(10%/12)" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
				}
			},
			pop2menu2_4: {
				text: "７列",
				click: function (e) {
					this.changeCSS("span.img", { width: "13%", height: "13%", margin: "calc(9%/14)" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
				}
			},
			pop2menu2_5: {
				text: "１０列",
				click: function (e) {
					this.changeCSS("span.img", { width: "9%", height: "9%", margin: "calc(10%/20)" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
				}
			}
		},
		mypopcontextmenu2_3: {
			pop2menu3_1: {
				text: "サムネ画像全体を表示",
				click: function (e) {
					this.changeCSS("span.img", { "background-size": "contain" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
					bgimage.updateFocus();
				}
			},
			pop2menu3_2: {
				text: "サムネ画面を埋める",
				class: "disabled",
				click: function (e) {
					this.changeCSS("span.img", { "background-size": "cover" });
					this.enableOtherMenusButMe(e);
					$(pop).css('display', 'flex');
					bgimage.updateFocus();
				}
			}
		}
	};
	class MyContextMenu {
		constructor(mycontextmenu, top, manager) {
			this.mouse = manager.mouse;
			this.controls = manager.controls;
			this.manager = manager; //MyContextMenuManager
			this.mycontextmenu = mycontextmenu;
			this.top = top === undefined ? document.body : top
			this.class = "mycontextmenu";
			this.firstmenu = undefined;
			this.contextmenu = [];
			this.parent = {}; //this.mycontextmenuの親子関係
			this.makeNodes();
		}
		changeCSS(selector, properties) {
			for (let sheet of document.styleSheets) {
				if (sheet.ownerNode.tagName.toUpperCase() === 'STYLE') {
					let rules = sheet.cssRules;
					for (let i = 0; i < rules.length; i++) {
						if (rules[i].selectorText === selector) {
							let r = rules[i];
							for (let p in properties) {
								let value = properties[p];
								r.style.setProperty(p, value);
							}
						}
					}
				}
			}
		}
		maeSyori() {
			let menu1, menu2, menu3;
			for (menu1 in this.mycontextmenu) {
				let menu1val = this.mycontextmenu[menu1];
				for (menu2 in menu1val) {
					let menu2val = menu1val[menu2];
					for (menu3 in menu2val) {
						let menu3val = menu2val[menu3];
						if (menu3 === "sub") {
							this.parent[menu3val] = menu1;
						}
					}
				}
			}
		}
		//同じ階層のmenu以外のmenuを有効にしmenuは無効。
		enableOtherMenusButMe(e) {
			let target = e instanceof HTMLElement ? e : e.target;
			let pe = target.parentElement;
			for (let node of pe.childNodes) {
				if (target === node) {
					$(node).addClass('disabled');
				} else {
					$(node).removeClass('disabled');
				}
			}
		}
		//showしたsubmenuからtop contextmenuまでの親以外のcontextmenuを非表示に
		hideOtherContextmenuButMyline(_node) {
			let node = _node.prop("id");
			let myline = [];
			while (node) {
				myline.push(node);
				node = this.parent[node];
			}
			for (let cm of this.contextmenu) {
				if (!myline.includes(cm.prop("id"))) {
					cm.removeClass('show');
				}
			}
		}
		hideAllContextmenu() {
			for (let cm of this.contextmenu) {
				cm.removeClass('show');
			}
		}
		checkId(id) {
			if ($("#" + id)[0]) console.error("duplicate id is " + id);
		}
		inNode(node) {
			if (node instanceof jQuery) node = node[0];
			let me = this.mouse.e;
			let nr = node.getBoundingClientRect();
			return nr.left <= me.pageX && me.pageX <= nr.left + nr.width &&
				nr.top <= me.pageY && me.pageY <= nr.top + nr.height;
		}
		showSubMenu(sub, li, e) {
			let mycontextmenu2 = $("#" + sub);
			this.hideOtherContextmenuButMyline(mycontextmenu2);
			let mycontextmenu = this.firstmenu;
			let menu = li;
			this.controls.remove({ remove_all: true });
			$(mycontextmenu2).addClass('show');
			let posX = e.pageX;
			let posY = e.pageY;
			if (mycontextmenu.prop("offsetLeft") + mycontextmenu.prop("offsetWidth") + mycontextmenu2.prop("offsetWidth") >= document.body.offsetWidth) {
				mycontextmenu2.css("left", mycontextmenu.prop("offsetLeft") - mycontextmenu2.prop("offsetWidth"));
			} else {
				mycontextmenu2.css("left", mycontextmenu.prop("offsetLeft") + mycontextmenu2.prop("offsetWidth"));
			}
			if (mycontextmenu.prop("offsetTop") + menu.prop("offsetTop") + mycontextmenu2.prop("offsetHeight") >= document.body.offsetHeight) {
				mycontextmenu2.css("top", posY - mycontextmenu2.prop("offsetHeight"));
				mycontextmenu2.css("top", mycontextmenu.prop("offsetTop") + menu.prop("offsetTop") + menu.prop("offsetHeight") - mycontextmenu2.prop("offsetHeight"));
			} else {
				mycontextmenu2.css("top", mycontextmenu.prop("offsetTop") + menu.prop("offsetTop"));
			}
		}
		makeSubNodes(node, subcontextmenu) {
			let ul = $('<ul>').appendTo(node);
			let id;
			for (id in subcontextmenu) {
				if (id === "firstmenu") {
					this.firstmenu = node;
					continue;
				}
				let li = $('<li>').appendTo(ul);
				this.checkId(id);
				li.prop("id", id);

				let submenu = subcontextmenu[id];
				let menu;
				let click = undefined;
				let sub = undefined;
				for (menu in submenu) {
					switch (menu) {
						case 'text':
							li.text(submenu[menu]);
							break;
						case 'class':
							li.addClass(submenu[menu]);
							break;
						case 'click':
							click = submenu[menu];
							break;
						case 'sub':
							sub = submenu[menu];
							break;
						default:
							console.error("Out of " + menu)
							break;
					}
				}
				if (sub) {
					li.addClass("sub");
					li.click((e) => {
						this.showSubMenu(sub, li, e);
						e.stopPropagation();
					});
					li.mouseover((e) => {
						const delayed = () => {
							let innode = this.inNode(li);
							if (!innode) return;

							this.showSubMenu(sub, li, e);
						}

						let timer = setTimeout(delayed, 500);
						e.stopPropagation();
					});
					li.mouseout((e) => {
						let mycontextmenu2 = $("#" + sub);
						let timer = setTimeout(function () { this.controls.handle() }.bind(this), 1000);
						this.controls.push([mycontextmenu2, false, timer]);
					});
				} else {//if(sub)
					li.click((e) => {
						if (!li.hasClass("disabled")) {
							this.hideAllContextmenu();
							if (click) {
								click.call(this, e);
							}
							e.stopPropagation();
						}
					});
				}
			}
		}
		makeNodes() {
			this.maeSyori();
			let id;
			for (id in this.mycontextmenu) {
				let div = $('<div>').appendTo(this.top);
				div.addClass(this.class);
				this.checkId(id);
				div.prop("id", id);
				this.makeSubNodes(div, this.mycontextmenu[id]);
				this.contextmenu.push(div);
				div.click((e) => {
					e.stopPropagation();
				});
				div.contextmenu((e) => {
					e.stopPropagation();
					return true;
				});
				if (div !== this.firstmenu) {
					div.mouseover((e) => {
						this.controls.remove(div);
					});
					div.mouseout((e) => {
						let timer = setTimeout(function () { this.controls.handle(); }.bind(this), 1000);
						this.controls.push([div, false, timer]);
					});
				}
			}
			if (!this.firstmenu) {
				console.error("no first menu");
				return;
			}
		}
		oncontextMenu(e) {
			this.hideAllContextmenu();
			this.firstmenu.addClass('show');
			let mycontextmenu = this.firstmenu;
			let posX = e.pageX;
			let posY = e.pageY;
			if (posX + mycontextmenu.prop("offsetWidth") >= document.body.offsetWidth) {
				mycontextmenu.css("right", 0);
				mycontextmenu.css("left", 'auto');
			} else {
				mycontextmenu.css("left", posX);
			}
			if (posY + mycontextmenu.prop("offsetHeight") >= document.body.offsetHeight) {
				mycontextmenu.css("top", posY - mycontextmenu.prop("offsetHeight"));
			} else {
				mycontextmenu.css("top", posY);
			}
			e.stopPropagation();
			return false;
		}
	}

	//複数のMyContextMenuを扱うクラス
	class MyContextMenuManager {
		constructor(mouse, controls) {
			this.mouse = mouse;
			this.controls = controls;
			this.mycontexts = [];
			document.body.addEventListener('click', () => {
				this.hideAllContextmenu();
				$(pop).hide();
			});
			$(window).contextmenu(e => {
				this.hideAllContextmenu();
				$(pop).hide();
				if (this.windowmenu) this.windowmenu.oncontextMenu(e);
				return false;
			});
		}
		addWindowMenu(contextmenu) {
			this.windowmenu = contextmenu;
		}
		factory(mycontextmenu, top) {
			let mcm = new MyContextMenu(mycontextmenu, top, this);
			this.mycontexts.push(mcm);
			return mcm;
		}
		hideAllContextmenu() {
			for (let m of this.mycontexts) {
				m.hideAllContextmenu();
			}
		}
	}

	class DragDrop {
		constructor() {
			let dropZone = document.body;
			dropZone.addEventListener('dragover', this.handleFilesDragOver.bind(this), false);
			dropZone.addEventListener('drop', this.handleFilesDrop.bind(this), false);
			files.addEventListener('change', this.handleFileSelect.bind(this), false);
		}
		handleFileSelect(evt) {//ファイルを選択する
			var files = evt.target.files;
			var output = [];
			this.readFiles(files);
			evt.target.value='';//Google Chromeで同じファイルを選択する時のため
		}
		handleFilesDragOver(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			evt.dataTransfer.dropEffect = 'copy';
		}
		handleFilesDrop(evt) {
			evt.stopPropagation();
			evt.preventDefault();
			let files = evt.dataTransfer.files;
			this.readFiles(files);
		}
		readFiles(files) {
			let promises = [];
			let f;
			for (let i = 0; f = files[i]; i++) {
				if (!f.type.match('^image')) {
					console.error("not image, ", f.name, f.type);
					continue;
				}
				let reader = new FileReader();
				function pr(res) {
					reader.onload = (function (theFile) {
						return function (e) {
							let src = e.target.result;
							let span;
							if (theFile.lastModifiedDate) {//chrome
								span = $('<span>').attr({ class: "img", tabindex: 0, title: theFile.name, name: theFile.name, type: theFile.type, size: theFile.size, lastModifiedDate: theFile.lastModifiedDate.toLocaleDateString() }).css("background-image", `url(${src})`).appendTo(popimages);
							} else {//firefox
								span = $('<span>').attr({ class: "img", tabindex: 0, title: theFile.name, name: theFile.name, type: theFile.type, size: theFile.size }).css("background-image", `url(${src})`).appendTo(popimages);
							}
							span.click(e => {
								bgimage.clickImage(e);
							});
							span.contextmenu(e => {
								bgimage.oncontextMenu(e);
								return false;
							});
							res();
						};
					})(f);
					reader.readAsDataURL(f);
				}
				let p = new Promise(pr);
				promises.push(p);
			}
			Promise.all(promises).then(() => {
				bgimage.reflesh();
			});
		}
	}

	class PopTopNode {
		constructor(bgimage) {
			this.bgimage = bgimage;
			$(del_button).click(function (e) {
				bgimage.removeCheckedImages();
			});
		}
	}

	const firststep = new FirstStep();
	const mouse = new Mouse();
	const controls = new Controls();

	const mcmm = new MyContextMenuManager(mouse, controls);
	const mcm = mcmm.factory(mycontextmenu, topcontext);
	mcmm.addWindowMenu(mcm);
	const mpcm = mcmm.factory(mypopcontextmenu, poptopcontext);
	const mpcm2 = mcmm.factory(mypopcontextmenu2, poptopcontext2);

	const bgimage = new BgImage(images, mpcm, mpcm2);
	const popmanage = new PopManage(mpcm2, bgimage, mcm);
	const sidearrows = new SideArrows(bgimage);

	const dragdrop = new DragDrop();
	const poptopnode = new PopTopNode(bgimage);

});
