/*
 * Copyright (c) 2025 michioxd
 * Released under GNU General Public License 3.0. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

/**
 * Original keyboard injector with some modifications by michioxd
 * @author @yume-chan
 * @license MIT
 * @see https://github.com/tango-adb/old-demo/blob/475465e612d2241a2802c23e19538e89ea2c4924/packages/demo/src/components/scrcpy/input.ts
 */
import type { AdbScrcpyClient, AdbScrcpyOptionsLatest } from "@yume-chan/adb-scrcpy";
import { AndroidKeyCode, AndroidKeyEventMeta, AndroidMotionEventAction } from "@yume-chan/scrcpy";

interface KeyboardInjector extends Disposable {
    down(key: string): Promise<void>;
    up(key: string): Promise<void>;
    reset(): Promise<void>;
}

export class ScrcpyKeyboardInjector implements KeyboardInjector {
    private readonly client: AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>>;

    private _controlLeft = false;
    private _controlRight = false;
    private _shiftLeft = false;
    private _shiftRight = false;
    private _altLeft = false;
    private _altRight = false;
    private _metaLeft = false;
    private _metaRight = false;

    private _capsLock = false;
    private _numLock = true;

    private _keys: Set<AndroidKeyCode> = new Set();

    public constructor(client: AdbScrcpyClient<AdbScrcpyOptionsLatest<boolean>>) {
        this.client = client;
    }
    [Symbol.dispose](): void {
        throw new Error("Method not implemented.");
    }

    private setModifier(keyCode: AndroidKeyCode, value: boolean) {
        switch (keyCode) {
            case AndroidKeyCode.ControlLeft:
                this._controlLeft = value;
                break;
            case AndroidKeyCode.ControlRight:
                this._controlRight = value;
                break;
            case AndroidKeyCode.ShiftLeft:
                this._shiftLeft = value;
                break;
            case AndroidKeyCode.ShiftRight:
                this._shiftRight = value;
                break;
            case AndroidKeyCode.AltLeft:
                this._altLeft = value;
                break;
            case AndroidKeyCode.AltRight:
                this._altRight = value;
                break;
            case AndroidKeyCode.MetaLeft:
                this._metaLeft = value;
                break;
            case AndroidKeyCode.MetaRight:
                this._metaRight = value;
                break;
            case AndroidKeyCode.CapsLock:
                if (value) {
                    this._capsLock = !this._capsLock;
                }
                break;
            case AndroidKeyCode.NumLock:
                if (value) {
                    this._numLock = !this._numLock;
                }
                break;
        }
    }

    private getMetaState(): AndroidKeyEventMeta {
        let metaState = 0;
        if (this._altLeft) {
            metaState |= AndroidKeyEventMeta.Alt | AndroidKeyEventMeta.AltLeft;
        }
        if (this._altRight) {
            metaState |= AndroidKeyEventMeta.Alt | AndroidKeyEventMeta.AltRight;
        }
        if (this._shiftLeft) {
            metaState |= AndroidKeyEventMeta.Shift | AndroidKeyEventMeta.ShiftLeft;
        }
        if (this._shiftRight) {
            metaState |= AndroidKeyEventMeta.Shift | AndroidKeyEventMeta.ShiftRight;
        }
        if (this._controlLeft) {
            metaState |= AndroidKeyEventMeta.Ctrl | AndroidKeyEventMeta.CtrlLeft;
        }
        if (this._controlRight) {
            metaState |= AndroidKeyEventMeta.Ctrl | AndroidKeyEventMeta.CtrlRight;
        }
        if (this._metaLeft) {
            metaState |= AndroidKeyEventMeta.Meta | AndroidKeyEventMeta.MetaLeft;
        }
        if (this._metaRight) {
            metaState |= AndroidKeyEventMeta.Meta | AndroidKeyEventMeta.MetaRight;
        }
        if (this._capsLock) {
            metaState |= AndroidKeyEventMeta.CapsLock;
        }
        if (this._numLock) {
            metaState |= AndroidKeyEventMeta.NumLock;
        }
        //@ts-expect-error nah
        return metaState;
    }

    public async down(key: string): Promise<void> {
        const keyCode = AndroidKeyCode[key as keyof typeof AndroidKeyCode];
        if (!keyCode) {
            return;
        }

        this.setModifier(keyCode, true);
        this._keys.add(keyCode);
        await this.client.controller?.injectKeyCode({
            action: AndroidMotionEventAction.Down,
            keyCode,
            metaState: this.getMetaState(),
            repeat: 0,
        });
    }

    public async up(key: string): Promise<void> {
        const keyCode = AndroidKeyCode[key as keyof typeof AndroidKeyCode];
        if (!keyCode) {
            return;
        }

        this.setModifier(keyCode, false);
        this._keys.delete(keyCode);
        await this.client.controller?.injectKeyCode({
            action: AndroidMotionEventAction.Up,
            keyCode,
            metaState: this.getMetaState(),
            repeat: 0,
        });
    }

    public async reset(): Promise<void> {
        this._controlLeft = false;
        this._controlRight = false;
        this._shiftLeft = false;
        this._shiftRight = false;
        this._altLeft = false;
        this._altRight = false;
        this._metaLeft = false;
        this._metaRight = false;
        for (const key of this._keys) {
            //@ts-expect-error nah
            this.up(AndroidKeyCode[key as number]);
        }
        this._keys.clear();
    }

    public dispose(): void {}
}
