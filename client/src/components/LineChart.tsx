
                    <LineChart
                        width={500}
                        height={300}
                        data={seriesData}
                        margin={{
                            top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                        }}
                                >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="solarpv" stroke={colours.solarpv} strokeWidth={2} />
                            <Line type="monotone" dataKey="solarthermal" stroke={colours.solarthermal} strokeWidth={2} />
                            <Line type="monotone" dataKey="wind" stroke={colours.wind} strokeWidth={2} />
                            <Line type="monotone" dataKey="gas" stroke={colours.gas} strokeWidth={2} />
                            <Line type="monotone" dataKey="carbon" stroke={colours.carbon} strokeWidth={2} />
                            <Line type="monotone" dataKey="nuclear" stroke={colours.nuclear} strokeWidth={2} />
                            <Line type="monotone" dataKey="hidro" stroke={colours.hidro} strokeWidth={2} />
                            <Line type="monotone" dataKey="thermal" stroke={colours.thermal} strokeWidth={2} />
                            <Line type="monotone" dataKey="cogen" stroke={colours.cogen} strokeWidth={2} />
                        </LineChart>
