const { powerSet } = require('combinatorial-generators');

const exchangeGenerator = (s1, s2) => {
    let set1 = [...powerSet(s1)];
    let set2 = [...powerSet(s2)];
    let exchanges = [];
    for (let i = 1; i <= Math.min(s1.length, s2.length); i++) {
        let z1 = set1.filter(s => s.length === i);
        let z2 = set2.filter(s => s.length === i);
        let sums1 = [...new Set(z1.map(z => z.reduce((a, b) => a + b, 0)))];
        let sums2 = [...new Set(z2.map(z => z.reduce((a, b) => a + b, 0)))];
        let current = [];
        for (let diff = Math.min(...sums2) - Math.max(...sums1); diff <= Math.max(...sums2) - Math.min(...sums1); diff++) {
            let validSum1s = sums1.filter(a => sums2.some(b => b - a === diff)).reverse();
            for (let j = 0; j < validSum1s.length; j++) {
                let z1s = z1.filter(z => z.reduce((a, b) => a + b, 0) === validSum1s[j]);
                let z2s = z2.filter(z => z.reduce((a, b) => a + b, 0) === validSum1s[j] + diff);
                z1s.forEach(z => { z2s.forEach(zz => current.push([z, zz])); });
            }
        }
        exchanges = [...exchanges, ...current];
    }
    return exchanges;
}

let ex = exchangeGenerator([1,2,3,4], [5,6,7,8,9]);
let [top, bottom] = ex[37];

console.log(top);