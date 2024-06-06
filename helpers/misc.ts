
export const objHasAtleastOneKey = (obj: object) => {
    for (const _ in obj) {
        return true;
    }

    return false;
}