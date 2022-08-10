import { request, gql } from 'graphql-request';
import { sortByField } from './fields';

const endpoint = "/api/graphql";

export async function fetchInstant() {
    const data = await request(endpoint, gql`{
    latestInstant {
        time,
        solarpv,
        wind,
        solarthermal,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestInstant

}

export async function fetchDaily() {
    const data = await request(endpoint, gql`{
    latestDaily(count: 30) {
        day,
        solarpv,
        wind,
        solarthermal,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestDaily
}

export async function fetchMonthly() {
    const data = await request(endpoint, gql`{
    latestMonthly(count: 12) {
        month,
        solarpv,
        wind,
        solarthermal,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestMonthly.sort(sortByField('month'))
}

export async function fetchYearly() {
    const data = await request(endpoint, gql`{
    latestYearly(count: 15) {
        year,
        solarpv,
        wind,
        solarthermal,
        hidro,
        nuclear,
        inter,
        thermal,
        cogen,
        gas,
        carbon,
    }}`)
    return data.latestYearly.sort(sortByField('year'))
}
