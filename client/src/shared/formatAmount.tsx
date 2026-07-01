const formatter = Intl.NumberFormat('en-GB')

const formatAmount = (nmb : number) => {
    if (nmb > 1000) {
        return formatter.format(nmb / 1000) + " GW";
    }
    return formatter.format(nmb) + " MW";
}

export default formatAmount
