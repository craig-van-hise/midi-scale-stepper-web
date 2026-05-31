import type { PCS_Entry } from '../types/midi';

export async function fetchBinaryLUT(url: string): Promise<(PCS_Entry | null)[]> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const dataView = new DataView(arrayBuffer);

    // Header Check
    const magic = String.fromCharCode(
        dataView.getUint8(0),
        dataView.getUint8(1),
        dataView.getUint8(2),
        dataView.getUint8(3)
    );

    if (magic !== 'PLUT') {
        throw new Error('Invalid binary LUT format');
    }

    const stringPoolOffset = dataView.getUint32(4, true);
    const rowsCount = dataView.getUint32(8, true);

    // Decode String Pool
    const stringPoolBuffer = arrayBuffer.slice(stringPoolOffset);
    const decoder = new TextDecoder();
    const stringPool: string[] = JSON.parse(decoder.decode(stringPoolBuffer));

    const rows: (PCS_Entry | null)[] = new Array(rowsCount).fill(null);

    for (let i = 0; i < rowsCount; i++) {
        const rowOffset = dataView.getUint32(12 + (i * 4), true);
        if (rowOffset === 0) continue;

        let pos = rowOffset;

        // Fixed Header (48 bytes)
        const decimal = dataView.getUint32(pos, true); pos += 4;
        const root_pc = dataView.getUint8(pos); pos += 1;
        const cardinality = dataView.getUint8(pos); pos += 1;
        const rotation = dataView.getUint8(pos); pos += 1;
        const mode = dataView.getUint8(pos); pos += 1;
        const hemitonia = dataView.getUint8(pos); pos += 1;
        const cohemitonia = dataView.getUint8(pos); pos += 1;
        const brightness = dataView.getInt8(pos); pos += 1;
        pos += 1; // Reserved
        const dissonance = dataView.getFloat32(pos, true); pos += 4;

        // String Indices (15 * 2 = 30 bytes)
        const getString = (offset: number) => {
            const idx = dataView.getUint16(offset, true);
            return (idx < stringPool.length) ? stringPool[idx] : "";
        };

        const chord_type = getString(pos); pos += 2;
        const data_table_chord_type = getString(pos); pos += 2;
        const base_triad = getString(pos); pos += 2;
        const base_7th = getString(pos); pos += 2;
        const scale_type = getString(pos); pos += 2;
        const root_scale = getString(pos); pos += 2;
        const mode_function = getString(pos); pos += 2;
        const bit12 = getString(pos); pos += 2;
        const diatonic_chromatic_exotic = getString(pos); pos += 2;
        
        // Black Key Root Spellings (5 * 2 = 10 bytes)
        const bk1 = getString(pos); pos += 2;
        const bk3 = getString(pos); pos += 2;
        const bk6 = getString(pos); pos += 2;
        const bk8 = getString(pos); pos += 2;
        const bk10 = getString(pos); pos += 2;

        const scale_bk_root_spellings: Record<string, string> = {};
        if (bk1) scale_bk_root_spellings["1"] = bk1;
        if (bk3) scale_bk_root_spellings["3"] = bk3;
        if (bk6) scale_bk_root_spellings["6"] = bk6;
        if (bk8) scale_bk_root_spellings["8"] = bk8;
        if (bk10) scale_bk_root_spellings["10"] = bk10;

        // Array Counts (8 * 1 = 8 bytes)
        const chordIntCount = dataView.getUint8(pos); pos += 1;
        const chordIntRotCount = dataView.getUint8(pos); pos += 1;
        const scaleIntCount = dataView.getUint8(pos); pos += 1;
        const pcsCount = dataView.getUint8(pos); pos += 1;
        const pciCount = dataView.getUint8(pos); pos += 1;
        const icvCount = dataView.getUint8(pos); pos += 1;
        const overrideCount = dataView.getUint8(pos); pos += 1;
        pos += 1; // Reserved

        pos = rowOffset + 64; // Ensure variable data starts at 64

        // Variable Data
        const chord_intervals: string[] = [];
        for (let k = 0; k < chordIntCount; k++) {
            chord_intervals.push(getString(pos));
            pos += 2;
        }

        const chord_intervals_rotated: string[] = [];
        for (let k = 0; k < chordIntRotCount; k++) {
            chord_intervals_rotated.push(getString(pos));
            pos += 2;
        }

        const scale_intervals: string[] = [];
        for (let k = 0; k < scaleIntCount; k++) {
            scale_intervals.push(getString(pos));
            pos += 2;
        }

        const pitch_class_set: number[] = [];
        for (let k = 0; k < pcsCount; k++) {
            pitch_class_set.push(dataView.getUint8(pos));
            pos += 1;
        }

        const pc_intervals: number[] = [];
        for (let k = 0; k < pciCount; k++) {
            pc_intervals.push(dataView.getUint8(pos));
            pos += 1;
        }

        const ic_vector: number[] = [];
        for (let k = 0; k < icvCount; k++) {
            ic_vector.push(dataView.getUint8(pos));
            pos += 1;
        }

        const manual_overrides: string[] = [];
        for (let k = 0; k < overrideCount; k++) {
            manual_overrides.push(getString(pos));
            pos += 2;
        }

        rows[decimal] = {
            decimal,
            chord_type,
            data_table_chord_type,
            rotation,
            root_pc,
            chord_intervals,
            chord_intervals_rotated,
            base_triad,
            base_7th,
            scale_type,
            mode,
            root_scale,
            mode_function,
            scale_intervals,
            pitch_class_set,
            "12-bit": bit12,
            pc_intervals,
            ic_vector,
            cardinality,
            diatonic_chromatic_exotic,
            hemitonia,
            cohemitonia,
            brightness,
            dissonance,
            manual_overrides,
            scale_bk_root_spellings
        };
    }

    return rows;
}
