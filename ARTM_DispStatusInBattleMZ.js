// ===================================================
// ARTM_DispStatusInBattleMZ
// Copyright (c) 2021 Artemis
// This software is released under the MIT license.
// http://opensource.org/licenses/mit-license.php
// ===================================================
// [Version]
// 1.0.0 初版
// ===================================================
/*:ja
 * @target MZ
 * @plugindesc スキルにステータス表示効果を付与するMZ専用プラグイン
 * @author Artemis
 *
 * @help ARTM_DispStatusInBattleMZ
 * スキルにステータス表示特性を付与するプラグインです。
 *
 *-------------------------------------------------
 * メモ欄タグは以下の通りです。
 *-------------------------------------------------
 * ★スキルのメモ欄任意行に下記タグを記述して下さい。
 *   <RS_RESEARCH:VALID>
 *   ☆タグ記述あり…有効、タグ記述なし…無効
 *
 *-------------------------------------------------
 * 使用上のご注意
 *-------------------------------------------------
 * ★上記タグを有効にしたスキルは必ず自分対象となります。
 *
 * プラグインコマンドはありません。
 *
 */
 
(() => {

    const PLUGIN_NAME = "ARTM_DispStatusInBattleMZ";
    const TAG_NAME  = "RS_RESEARCH";
    const TAG_VALUE = "VALID";

    function Window_StatusParamsEx() {
        this.initialize(...arguments);
    }

    Window_StatusParamsEx.prototype = Object.create(Window_StatusBase.prototype);
    Window_StatusParamsEx.prototype.constructor = Window_StatusParamsEx;

    Window_StatusParamsEx.prototype.initialize = function(rect) {
        Window_StatusBase.prototype.initialize.call(this, rect);
        this._actor = null;
    };

    Window_StatusParamsEx.prototype.setActor = function(actor) {
        if (this._actor !== actor) {
            this._actor = actor;
        }
        this.refresh();
    };

    Window_StatusParamsEx.prototype.maxItems = function() {
        return 9;
    };

    Window_StatusParamsEx.prototype.maxItemsH = function() {
        return 1;
    };

    Window_StatusParamsEx.prototype.maxItemsP = function() {
        return 6;
    };

    Window_StatusParamsEx.prototype.itemHeight = function() {
        return this.lineHeight();
    };

    Window_StatusParamsEx.prototype.itemsWidth = function() {
        return [160, 60, 10];
    };

    Window_StatusParamsEx.prototype.drawItem = function(index) {
        const rect = this.itemLineRect(index);
        if (index === 0) {
            this.drawItemHeader(index, rect);
        } else {
            this.drawItemParam(index, rect);
        }
    };

    Window_StatusParamsEx.prototype.drawItemHeader = function(...args) {
        const rect = args[1];
        const index = args[0];
        const paramId = index + this.maxItemsH();
        const value = this._actor.name();
        const aw = this.itemsWidth();
        const width = aw[0] + aw[1] + aw[2];
        this.changeTextColor(ColorManager.textColor(6));
        this.drawText(value, rect.x, rect.y, width, "center");
    };

    Window_StatusParamsEx.prototype.drawItemParam = function(...args) {
        const rect = args[1];
        const index = args[0] - this.maxItemsH();
        const name = TextManager.param(index + 2);
        const actor = this._actor;
        const aw = this.itemsWidth();
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(name, rect.x, rect.y, aw[0]);
        if (index < this.maxItemsP()) {
            const param = index + 2;
            const value = actor.param(param);
            this.selectTextColor(param);
            this.drawTextEx(value, rect)
        } else {
            const param = index - this.maxItemsP();
            const value = actor.xparam(param);
            this.resetTextColor();
            this.drawTextEx(value * 100, rect, "%");
        }
    };

    Window_StatusParamsEx.prototype.drawItemBackground = function(/*index*/) {
        //
    };

    Window_StatusParamsEx.prototype.drawTextEx = function(...args) {
        const value = args[0];
        const rect = args[1];
        const unit = args[2] || "";
        const aw = this.itemsWidth();
        const x = rect.x + aw[0];
        const y = rect.y;
        this.drawText(value, x, y, aw[1], "right");
        if (unit + "" != "") {
            const xx = x + aw[1] + 1;
            this.drawText(unit, xx, y, 10, "left");
        }
    };

    Window_StatusParamsEx.prototype.selectTextColor = function(paramId) {
        const actor = this._actor;
        const paramBase = 
            actor.paramBasePlus(paramId) * 
            actor.paramRate(paramId);
        const paramGain = actor.param(paramId);
        const sign = paramGain - paramBase;
        if (sign === 0)  {
            this.resetTextColor();
        } else {
            this.changeTextColor(
              ColorManager.paramchangeTextColor(sign)
            );
        }
    };

    const _Game_Action_makeTargets = Game_Action.prototype.makeTargets;
    Game_Action.prototype.makeTargets = function() {
        return (
            DataManager.isSkill(this.item()) &&
            this.item().meta[TAG_NAME] === TAG_VALUE ?
            [this.subject()] :
            _Game_Action_makeTargets.call(this)
        );
    };

    const _Game_Action_apply = Game_Action.prototype.apply;
    Game_Action.prototype.apply = function(target) {
        _Game_Action_apply.call(this, target);
        if (DataManager.isSkill(this.item()) &&
            this.item().meta[TAG_NAME] === TAG_VALUE) {
             const targets = BattleManager._targets;
             this.dispStatus(target);
             return;
        }
        _Game_Action_apply.call(this, target);
    };

    Game_Action.prototype.dispStatus = function(target) {
        const logWindow = BattleManager._logWindow;
        _Game_Action_apply.call(this, target);
        logWindow.waitRepeat(3);
        logWindow.push("clear");
        logWindow.push("movMenuButton", false);
        logWindow.push("dispStatus", target, true);
        logWindow.waitRepeat(20);
        logWindow.push("dispStatus", null, false);
        logWindow.push("movMenuButton", true);
        target.result().success = true;
    };

    Window_BattleLog.prototype.waitRepeat = function(count) {
        for (let i = 0; i < count; i++) {
          this.push("wait");
        }
    };

    Window_BattleLog.prototype.dispStatus = function(target, flag) {
        const scene = SceneManager._scene;
        const statusParamsWindowEx = scene._statusParamsWindowEx;
        if (!(flag && target)) {
            statusParamsWindowEx.visible = false;
            return
        }
        statusParamsWindowEx.setActor(target);
        statusParamsWindowEx.visible = true;
    }

    Window_BattleLog.prototype.movMenuButton = function(flag) {
        const scene = SceneManager._scene;
        const statusParamsWindowEx = scene._statusParamsWindowEx;
        if (!flag && scene._saveButtonY === 0) {
            const bh = scene.buttonAreaHeight();
            const top = scene.helpAreaTop();
            const height = statusParamsWindowEx.contentsHeight();
            const offsetY = Math.floor((bh - 48) / 2);
            scene._saveButtonY = scene._cancelButton.y;
            scene._cancelButton.y = top + height + offsetY;
        } else if (flag) {
            scene._cancelButton.y = scene._saveButtonY;
            scene._saveButtonY = 0;
        }
    };

    const _Scene_Battle_initialize = Scene_Battle.prototype.initialize;
    Scene_Battle.prototype.initialize = function() {
        _Scene_Battle_initialize.call(this);
        this._saveButtonY = 0;
    };

    const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
    Scene_Battle.prototype.createAllWindows = function() {
        _Scene_Battle_createAllWindows.call(this);
        this.createStatusParamsWindow();
    };

    Scene_Battle.prototype.createStatusParamsWindow = function() {
        const rect = this.statusParamsWindowRectEx();
        this._statusParamsWindowEx = new Window_StatusParamsEx(rect);
        this._statusParamsWindowEx.visible = false;
        this.addWindow(this._statusParamsWindowEx);
    };

    Scene_Battle.prototype.statusParamsWindowRectEx = function() {
        const ww = this.statusParamsWidth();
        const wh = this.statusParamsHeight();
        const wx = Graphics.boxWidth - ww;
        const wy = 0;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_Battle.prototype.statusParamsWidth = function() {
        return 300;
    };

    Scene_Battle.prototype.statusParamsHeight = function() {
        return this.calcWindowHeight(9, false);
    };

})();