function isInt(value: any): boolean {
        return !isNaN(Number(value)) && value.trim() !== '';

}

console.log(isInt(4))