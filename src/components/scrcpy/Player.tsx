/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import { useEffect, useRef, useState } from 'react'
import ScrcpyStream from './Stream'
import type { Adb } from '@yume-chan/adb'
import cls from '@/screen/Device.module.scss'
import { Spinner, Text } from '@radix-ui/themes'
import { useTranslation } from 'react-i18next'

export default function ScrcpyPlayer({ dev }: { dev: Adb }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const playerRef = useRef<HTMLDivElement>(null)
    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        if (!canvasRef.current || !playerRef.current) return

        const resizeCanvas = () => {
            if (!playerRef.current) return
            const { clientWidth: windowWidth, clientHeight: windowHeight } = playerRef.current
            const aspectRatio = width / height || 16 / 9

            const wa = windowWidth / windowHeight > aspectRatio ? windowHeight * aspectRatio : windowWidth
            const ha = windowWidth / windowHeight > aspectRatio ? windowHeight : windowWidth / aspectRatio
            canvasRef.current!.style.width = `${wa}px`
            canvasRef.current!.style.height = `${ha}px`
        }

        window.addEventListener('resize', resizeCanvas)
        resizeCanvas()

        return () => {
            window.removeEventListener('resize', resizeCanvas)
        }
    }, [width, height])

    useEffect(() => {
        if (!canvasRef.current) return

        const stream = new ScrcpyStream({
            device: dev,
            canvas: canvasRef.current,
            options: {
                maxSize: 1080,
                maxFps: 60
            },
            onResize: (w, h) => {
                setWidth(w)
                setHeight(h)
            },
            onConnected: () => {
                setLoading(false)
            }
        })
        ;(async () => {
            if (!canvasRef.current) return

            try {
                await stream.start()
            } catch (e) {
                console.error(e)
            }
        })()

        return () => {
            stream.stop()
        }
    }, [dev])
    return (
        <div className={cls.Player} ref={playerRef}>
            {loading && (
                <div className={cls.Loading}>
                    <Spinner size="3" /> <Text size="1">{t('connecting_to_device')}</Text>
                </div>
            )}
            <canvas className={cls.Canvas} ref={canvasRef} />
        </div>
    )
}
