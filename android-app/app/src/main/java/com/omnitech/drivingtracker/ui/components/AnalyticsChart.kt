package com.omnitech.drivingtracker.ui.components

import androidx.compose.runtime.Composable
import com.patrykandpatrick.vico.compose.cartesian.axis.HorizontalAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.VerticalAxis
import com.patrykandpatrick.vico.compose.cartesian.axis.rememberAxisLabelComponent
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianLayerRangeProvider
import com.patrykandpatrick.vico.compose.cartesian.data.CartesianValueFormatter
import com.patrykandpatrick.vico.compose.cartesian.layer.rememberLineCartesianLayer
import com.patrykandpatrick.vico.compose.cartesian.rememberCartesianChart
import com.patrykandpatrick.vico.compose.common.component.rememberTextComponent

@Composable
fun AnalyticsChart(
    yAxisTitle: String,
    dates: List<String>
) = rememberCartesianChart(
    rememberLineCartesianLayer(
        rangeProvider = CartesianLayerRangeProvider.fixed(minY = 0.0, maxY = 100.0)
    ),
    startAxis = VerticalAxis.rememberStart(
        label = rememberAxisLabelComponent(),
        titleComponent = rememberTextComponent(),
        title = {yAxisTitle}
    ),
    bottomAxis = HorizontalAxis.rememberBottom(
        label = rememberAxisLabelComponent(),
        titleComponent = rememberTextComponent(),
        title = {"Date"},
        valueFormatter = CartesianValueFormatter{
                _, value, _ ->
            dates.getOrNull(value.toInt())?.takeLast(5) ?: ""
        }
    )
)
