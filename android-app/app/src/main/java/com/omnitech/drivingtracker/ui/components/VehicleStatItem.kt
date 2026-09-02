package com.omnitech.drivingtracker.ui.components

import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.Modifier
import androidx.compose.foundation.layout.*
import androidx.compose.ui.Alignment
import androidx.compose.material3.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import android.app.Dialog
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.material3.*
import androidx.compose.ui.window.Dialog
import com.omnitech.drivingtracker.ui.obd.Vehicle
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.omnitech.drivingtracker.R
import androidx.compose.material.icons.filled.Info
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VehicleStatItem(
    iconPainter: Painter? = null,
    iconVector: ImageVector? = null,
    label: String,
    value: String,
    tint: Color = Color.DarkGray,
    modifier: Modifier = Modifier,
    tooltipText: String? = null
) {

    val tooltipState = rememberTooltipState(isPersistent = true)
    val scope = rememberCoroutineScope()

    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {

        if (iconPainter != null) {
            Icon(
                painter = iconPainter,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = tint
            )
        } else if (iconVector != null) {
            Icon(
                imageVector = iconVector,
                contentDescription = null,
                modifier = Modifier.size(32.dp),
                tint = Color.DarkGray
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        Column {
            Row(verticalAlignment = Alignment.CenterVertically){
                Text(text = label, style = MaterialTheme.typography.labelSmall)
                if(tooltipText != null){
                    Spacer(modifier = Modifier.width(4.dp))
                    TooltipBox(
                        positionProvider = TooltipDefaults.rememberTooltipPositionProvider(),
                        tooltip = {
                            PlainTooltip{
                                Text(
                                    tooltipText,
                                    modifier = Modifier.clickable{ tooltipState.dismiss() }
                                )
                            }
                        },
                        state = tooltipState
                    ) {
                        Icon(
                            imageVector = Icons.Default.Info,
                            contentDescription = "Info",
                            modifier = Modifier
                                .requiredSize(12.dp)
                                .clickable{
                                    scope.launch{
                                        if (tooltipState.isVisible) tooltipState.dismiss()
                                        else tooltipState.show()}},
                            tint = Color.Gray
                        )
                    }
                }
            }
            Text(text = value, style = MaterialTheme.typography.bodyLarge)
        }

    }

}