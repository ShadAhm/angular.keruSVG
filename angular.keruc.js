"use strict";

var f = function ($compile) {
    return {
        restrict: 'E',
        template: '<svg id="canvasId" xmlns="http://www.w3.org/2000/svg" width="500" height="500">',
        scope: {
            rows: '=data',
            selectedNodes: '=',
            onSelected: '&',
            onDeselected: '&',
            onDisallowedSelected: '&'
        },
        link: function (scope, element, attrs) {
            var rows = null;

            scope.settings = {
                canvasWidth: attrs.canvasWidth || 500,
                canvasHeight: attrs.canvasHeight || 500,
                vacantColourBg: attrs.vacantColourBg || '#76D75D',
                vacantColourFg: attrs.vacantColourFg || '#C1F2B4',
                occupiedColourBg: attrs.occupiedColourBg || '#F56979',
                occupiedColourFg: attrs.occupiedColourFg || '#BB1F31',
                selectedColourBg: attrs.selectedColourBg || '#7854AF',
                selectedColourFg: attrs.selectedColourFg || '#472085',
            };

            var structure =
                {
                    eachCabangX: 0,
                    eachCabangY: 0,
                    eachSquare: { width: 0, height: 0 }
                }

            var onRowDataChanged = function (newData) {
                if (newData == null)
                    return;

                rows = newData.rows;
                var canvasWidth = scope.settings.canvasWidth;
                var canvasHeight = scope.settings.canvasHeight;

                var longestRow = 0;

                for (var i = 0; i < rows.length; ++i) {
                    if (rows[i].nodes.length >= longestRow)
                        longestRow = rows[i].nodes.length;
                }

                var numberOfCabangX = longestRow + 1;
                var numberOfCabangY = rows.length + 1;

                var totalCabangSpaceX = canvasWidth * 0.1;
                var totalCabangSpaceY = canvasHeight * 0.1;

                structure.eachCabangX = totalCabangSpaceX / numberOfCabangX;
                structure.eachCabangY = totalCabangSpaceY / numberOfCabangY;
                structure.eachSquare.width = (canvasWidth - totalCabangSpaceX) / longestRow;
                structure.eachSquare.height = (canvasHeight - totalCabangSpaceY) / rows.length;

                draw();
                // addClickEventToCanvas();
            };

            scope.$watch('rows', onRowDataChanged);

            var drawSquare = function (selected, xPos, yPos, width, height, displayName) {
                var svgns = "http://www.w3.org/2000/svg";

                var fontSize = structure.eachSquare.width * 0.4;
                var seatColour = '#000000';
                var textColour = '#000000';

                var boxCentrePointX = xPos + (structure.eachSquare.width / 2);
                var boxCentrePointY = yPos + (structure.eachSquare.height / 2);

                switch (selected) {
                    case 0:
                        seatColour = scope.settings.vacantColourBg;
                        textColour = scope.settings.vacantColourFg;
                        break;
                    case 1:
                        seatColour = scope.settings.occupiedColourBg;
                        textColour = scope.settings.occupiedColourFg;
                        break;
                }

                var seatBox = document.createElementNS(svgns, 'g');
                var clipPathId = 'x' + xPos + 'y' + yPos;
                clipPathId = clipPathId.replace(/\./g, 'dot');

                var clipPath = document.createElementNS(svgns, 'clipPath');
                clipPath.setAttributeNS(null, 'id', clipPathId);

                var r = document.createElementNS(svgns, 'rect');
                r.setAttributeNS(null, 'x', xPos);
                r.setAttributeNS(null, 'width', width);
                r.setAttributeNS(null, 'y', yPos);
                r.setAttributeNS(null, 'height', height);
                clipPath.appendChild(r);

                var rect = document.createElementNS(svgns, 'rect');
                rect.setAttributeNS(null, 'x', xPos);
                rect.setAttributeNS(null, 'y', yPos);
                rect.setAttributeNS(null, 'width', width);
                rect.setAttributeNS(null, 'height', height);
                rect.setAttributeNS(null, 'fill', seatColour);
                seatBox.appendChild(rect);

                var newText = document.createElementNS(svgns, 'text');
                newText.setAttributeNS(null, 'text-anchor', 'middle');
                newText.setAttributeNS(null, 'dominant-baseline', 'central');
                newText.setAttributeNS(null, 'x', boxCentrePointX);
                newText.setAttributeNS(null, 'y', boxCentrePointY);
                newText.setAttributeNS(null, 'font-size', fontSize + '');
                newText.setAttributeNS(null, 'fill', textColour);

                var textNode = document.createTextNode(displayName);
                newText.appendChild(textNode);

                seatBox.appendChild(newText);

                var parent = document.getElementById('canvasId');

                parent.appendChild(clipPath);
                parent.appendChild(seatBox);

                seatBox['clipPathId'] = clipPathId;
                seatBox['boxX'] = xPos;
                seatBox['boxY'] = yPos;


                var startXPos = xPos - structure.eachSquare.width;
                var startYPos = yPos;

                var rect1 = document.createElementNS(svgns, 'rect');
                rect1.setAttributeNS(null, 'x', startXPos.toString());
                rect1.setAttributeNS(null, 'clip-path', 'url(#' + clipPathId + ')');
                rect1.setAttributeNS(null, 'y', startYPos);
                rect1.setAttributeNS(null, 'width', structure.eachSquare.width.toString());
                rect1.setAttributeNS(null, 'height', structure.eachSquare.height.toString());
                rect1.setAttributeNS(null, 'fill', '#333');

                var ani = document.createElementNS(svgns, 'animate');
                ani.setAttributeNS(null, 'id', clipPathId + 'anim');
                ani.setAttributeNS(null, 'attributeName', 'x');
                ani.setAttributeNS(null, 'attributeType', 'xml');
                ani.setAttributeNS(null, 'from', startXPos.toString());
                ani.setAttributeNS(null, 'to', xPos);
                ani.setAttributeNS(null, 'begin', 'indefinite');
                ani.setAttributeNS(null, 'dur', '0.1s');
                ani.setAttributeNS(null, 'fill', 'freeze');

                rect1.appendChild(ani);
                parent.appendChild(rect1);

                return seatBox;
            };

            var onSquareClick = function (seatBoxEl, clickedNode) {
                var o = document.getElementById(seatBoxEl.clipPathId + 'anim');
                var startXPos = seatBoxEl.boxX - structure.eachSquare.width;                    
                
                if (clickedNode.selected == 0) {
                    clickedNode.selected = 2;
                    
                    o = document.getElementById(seatBoxEl.clipPathId + 'anim');
                    o.setAttributeNS(null, 'from', startXPos.toString());
                    o.setAttributeNS(null, 'to', seatBoxEl.boxX);
                }
                else if (clickedNode.selected == 2) {
                    clickedNode.selected = 0;
                    o = document.getElementById(seatBoxEl.clipPathId + 'animdeselect');
                    o.setAttributeNS(null, 'from', seatBoxEl.boxX);
                    o.setAttributeNS(null, 'to', startXPos.toString());
                }
                
                o.beginElement();
            };

            var draw = function () {
                if (rows == null)
                    return;

                function kDelegate(seatBox, selNode) {
                    return function () {
                        onSquareClick(seatBox, selNode);
                    }
                }

                var lastUp = 0;
                for (var i = 0; i < rows.length; ++i) {
                    var lastRight = 0;

                    for (var j = 0; j < rows[i].nodes.length; ++j) {
                        if (rows[i].nodes[j].type == 0) {
                            lastRight = lastRight + structure.eachCabangX + structure.eachSquare.width;
                        }
                        else {
                            var seatBox = drawSquare(
                                rows[i].nodes[j].selected,
                                lastRight + structure.eachCabangX,
                                lastUp + structure.eachCabangY,
                                structure.eachSquare.width,
                                structure.eachSquare.height,
                                rows[i].nodes[j].displayName
                                );

                            seatBox.addEventListener('click', kDelegate(seatBox, rows[i].nodes[j]), true);

                            lastRight = lastRight + structure.eachCabangX + structure.eachSquare.width;
                        }
                    }

                    lastUp = lastUp + structure.eachCabangY + structure.eachSquare.height;
                }
            };
        }
    }
};

angular.module('keruC', []).directive('kerucSeatpicker', ['$compile', f]);
