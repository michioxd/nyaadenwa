/*
 * Copyright (c) 2025 michioxd
 * Released under MIT license. See LICENSE for more details.
 * Repository: https://github.com/michioxd/nyaadenwa
 */

import objectHash from 'object-hash'

export const getDeviceHash = (device: { manufacturerName: string; name: string; serial: string }) => {
    return objectHash(
        {
            manufacturerName: device.manufacturerName,
            name: device.name,
            serial: device.serial
        },
        { algorithm: 'sha1' }
    )
}
