type Listener = () => void;

let activeCarId: string | null = null;
let connectedCarId: string | null = null;
let selectedCarId: string | null = null;

const listeners = new Set<Listener>();

function emit() {
    listeners.forEach((fn) => fn());
}

export const activeVehicleRuntime = {
    getActiveCarId() {
        return connectedCarId || selectedCarId || activeCarId || null;
    },

    getConnectedCarId() {
        return connectedCarId;
    },

    getSelectedCarId() {
        return selectedCarId;
    },

    setSelectedCarId(carId: string | null) {
        selectedCarId = carId;
        activeCarId = connectedCarId || selectedCarId || null;
        emit();
    },

    setConnectedCarId(carId: string | null) {
        connectedCarId = carId;

        if (carId && selectedCarId !== carId) {
            selectedCarId = carId;
        }

        activeCarId = connectedCarId || selectedCarId || null;

        emit();
    },

    clear() {
        activeCarId = null;
        connectedCarId = null;
        selectedCarId = null;
        emit();
    },

    subscribe(listener: Listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};