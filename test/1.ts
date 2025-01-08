function getValueFromCommands(str: string): string | null {
        let split: any = str.split(" ")

        let rawArr:string[] = []
        split.forEach((cmd, i) => {
                if (i != 0) {
                        rawArr.push(cmd)
                } else {
                        //pass
                }
        })

        if (rawArr.length == 0) {
                return null;
        } else {
                return rawArr.join(' ')
        }

        
}

console.log(`\"${getValueFromCommands("/abc")}\"`)