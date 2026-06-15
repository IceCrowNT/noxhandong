param(
    [string]$SourceList = "E:\1. THU\BÁO CÁO\2026\Phiếu giao nhận thông báo tầng 1\Phieu giao nhan thong bao - Tat ca lo tang 1.docx",
    [string]$OutputDirectory = "E:\1. THU\BÁO CÁO\2026\Phiếu giao nhận thông báo tầng 1\Danh sách lắp bạt theo lô"
)

$ErrorActionPreference = "Stop"

function Convert-CmToPoint([double]$Centimeters) {
    return $Centimeters * 28.3464567
}

function Clean-CellText([string]$Text) {
    return $Text -replace "[`r`a]", ""
}

function Add-Record([hashtable]$Map, [string]$Apartment, [string]$Date) {
    if (-not $Map.ContainsKey($Apartment)) {
        $Map[$Apartment] = [System.Collections.Generic.List[string]]::new()
    }
    $Map[$Apartment].Add($Date)
}

# Ảnh năm 2025-2026: các căn đã đăng ký/làm đơn lắp bạt.
$registrations = @{}
Add-Record $registrations "L1.124" "Tháng 04/2026"
Add-Record $registrations "L4B.115" "Tháng 03/2026"
Add-Record $registrations "L4B.118" "Tháng 03/2026"
Add-Record $registrations "L3.101" "Tháng 02/2026"
Add-Record $registrations "L4B.126" "Tháng 02/2026"
Add-Record $registrations "L2.128" "30/12/2025"
Add-Record $registrations "L4B.101" "18/10/2025"
Add-Record $registrations "L1.124" "10/10/2025"
Add-Record $registrations "L1.118" "09/10/2025"
Add-Record $registrations "L4C.127" "03/09/2025"
Add-Record $registrations "L4C.114" "18/08/2025"
Add-Record $registrations "L4A.101" "15/08/2025"
Add-Record $registrations "L1.120" "15/08/2025"
Add-Record $registrations "L4B.125" "11/08/2025"
Add-Record $registrations "L3.108" "06/08/2025"
Add-Record $registrations "L4B.136" "23/07/2025"
Add-Record $registrations "L4A.116" "14/06/2025"
Add-Record $registrations "L4A.106B" "14/06/2025"
Add-Record $registrations "L4A.112" "19/06/2025"
Add-Record $registrations "L4C.101" "14/06/2025"
Add-Record $registrations "L4A.107" "07/06/2025"
Add-Record $registrations "L4C.125" "03/06/2025"
Add-Record $registrations "L1.122" "02/06/2025"
Add-Record $registrations "L4C.102" "26/05/2025"
Add-Record $registrations "L4B.129" "20/05/2025"
Add-Record $registrations "L4B.127" "20/05/2025"
Add-Record $registrations "L4C.108" "07/05/2025"
Add-Record $registrations "L4B.109" "06/05/2025"
Add-Record $registrations "L4B.111A" "06/05/2025"
Add-Record $registrations "L4A.134" "06/05/2025"
Add-Record $registrations "L4A.136" "06/05/2025"

# Ảnh năm 2024: các căn có biên bản vi phạm mái che, tách biệt với đăng ký.
$violations = @{}
Add-Record $violations "L4A.122" "15/08/2024"
Add-Record $violations "L4A.120" "15/08/2024"
Add-Record $violations "L4A.118" "15/08/2024"
Add-Record $violations "L4A.124" "15/08/2024"
Add-Record $violations "L2.101" "18/06/2024"
Add-Record $violations "L2.109" "18/06/2024"
Add-Record $violations "L2.103" "18/06/2024"
Add-Record $violations "L2.105" "18/06/2024"
Add-Record $violations "L2.107" "18/06/2024"
Add-Record $violations "L3.114" "02/08/2024"
Add-Record $violations "L3.110" "02/08/2024"
Add-Record $violations "L3.106A" "02/08/2024"
Add-Record $violations "L2.111B" "02/08/2024"
Add-Record $violations "L3.112" "02/08/2024"
Add-Record $violations "L3.111A" "02/08/2024"
Add-Record $violations "L3.116" "02/08/2024"
Add-Record $violations "L4C.132" "02/08/2024"
Add-Record $violations "L2.115" "03/08/2024"
Add-Record $violations "L4B.101" "03/08/2024"
Add-Record $violations "L3.111B" "02/08/2024"
Add-Record $violations "L2.111A" "02/08/2024"
Add-Record $violations "L2.117" "02/08/2024"
Add-Record $violations "L3.102" "02/08/2024"

function Set-PageSetup($Document) {
    foreach ($section in $Document.Sections) {
        $section.PageSetup.PaperSize = 7
        $section.PageSetup.Orientation = 1
        $section.PageSetup.TopMargin = Convert-CmToPoint 1.05
        $section.PageSetup.BottomMargin = Convert-CmToPoint 1.05
        $section.PageSetup.LeftMargin = Convert-CmToPoint 1.0
        $section.PageSetup.RightMargin = Convert-CmToPoint 1.0
    }
}

function Add-BlockPage($Word, $Document, [string]$Block, [string[]]$Apartments, [bool]$PageBreak) {
    $selection = $Word.Selection
    if ($PageBreak) {
        $selection.InsertBreak(7)
    }

    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 14
    $selection.Font.Bold = -1
    $selection.ParagraphFormat.Alignment = 1
    $selection.ParagraphFormat.SpaceAfter = 2
    $selection.TypeText("DANH SÁCH THEO DÕI LẮP BẠT - LÔ $Block")
    $selection.TypeParagraph()

    $selection.Font.Size = 9
    $selection.Font.Bold = 0
    $selection.ParagraphFormat.SpaceAfter = 4
    $selection.TypeText("Dữ liệu đăng ký: ảnh năm 2025-2026. Dữ liệu biên bản vi phạm mái che: ảnh năm 2024.")
    $selection.TypeParagraph()

    $headers = @(
        "STT",
        "Lô - số căn hộ",
        "Đã đăng ký/làm đơn",
        "Ngày đăng ký/làm đơn",
        "Có biên bản vi phạm mái che",
        "Ngày lập biên bản",
        "Ghi chú"
    )
    $table = $Document.Tables.Add($selection.Range, $Apartments.Count + 1, $headers.Count)
    $table.Borders.Enable = 1
    $table.AllowAutoFit = $false
    $table.Rows.Item(1).HeadingFormat = -1
    $table.Rows.Item(1).HeightRule = 2
    $table.Rows.Item(1).Height = Convert-CmToPoint 1.15

    $widths = @(1.0, 3.0, 3.1, 4.5, 4.0, 3.5, 7.0)
    for ($column = 1; $column -le $headers.Count; $column++) {
        $table.Columns.Item($column).Width = Convert-CmToPoint $widths[$column - 1]
        $cell = $table.Cell(1, $column)
        $cell.Range.Text = $headers[$column - 1]
        $cell.Range.Font.Name = "Times New Roman"
        $cell.Range.Font.Size = 8.5
        $cell.Range.Font.Bold = -1
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.VerticalAlignment = 1
        $cell.Shading.BackgroundPatternColor = 14277081
    }

    foreach ($index in 0..($Apartments.Count - 1)) {
        $row = $index + 2
        $apartment = $Apartments[$index]
        $isRegistered = $registrations.ContainsKey($apartment)
        $hasViolation = $violations.ContainsKey($apartment)

        $table.Rows.Item($row).HeightRule = 1
        $table.Rows.Item($row).Height = Convert-CmToPoint 0.68
        $table.Cell($row, 1).Range.Text = [string]($index + 1)
        $table.Cell($row, 2).Range.Text = $apartment
        $table.Cell($row, 3).Range.Text = $(if ($isRegistered) { "X" } else { "" })
        $table.Cell($row, 4).Range.Text = $(if ($isRegistered) { $registrations[$apartment] -join "; " } else { "" })
        $table.Cell($row, 5).Range.Text = $(if ($hasViolation) { "X" } else { "" })
        $table.Cell($row, 6).Range.Text = $(if ($hasViolation) { $violations[$apartment] -join "; " } else { "" })
        $table.Cell($row, 7).Range.Text = ""

        for ($column = 1; $column -le $headers.Count; $column++) {
            $cell = $table.Cell($row, $column)
            $cell.Range.Font.Name = "Times New Roman"
            $cell.Range.Font.Size = 8.2
            $cell.VerticalAlignment = 1
            $cell.Range.ParagraphFormat.Alignment = $(if ($column -in @(1, 2, 3, 5)) { 1 } else { 0 })
            if ($isRegistered -and $column -in @(3, 4)) {
                $cell.Shading.BackgroundPatternColor = 15917529
            }
            if ($hasViolation -and $column -in @(5, 6)) {
                $cell.Shading.BackgroundPatternColor = 13434879
            }
        }
    }

    $registeredCount = @($Apartments | Where-Object { $registrations.ContainsKey($_) }).Count
    $violationCount = @($Apartments | Where-Object { $violations.ContainsKey($_) }).Count
    $bothCount = @($Apartments | Where-Object { $registrations.ContainsKey($_) -and $violations.ContainsKey($_) }).Count
    $unrecordedCount = $Apartments.Count - @($Apartments | Where-Object {
        $registrations.ContainsKey($_) -or $violations.ContainsKey($_)
    }).Count

    $selection.SetRange($table.Range.End, $table.Range.End)
    $selection.TypeParagraph()
    $selection.Font.Name = "Times New Roman"
    $selection.Font.Size = 9.5
    $selection.Font.Bold = -1
    $selection.ParagraphFormat.Alignment = 0
    $selection.TypeText(
        "THỐNG KÊ LÔ ${Block}: Tổng $($Apartments.Count) căn | Đã đăng ký: $registeredCount | " +
        "Có biên bản vi phạm năm 2024: $violationCount | Có cả hai: $bothCount | Chưa có dữ liệu: $unrecordedCount"
    )
    $selection.TypeParagraph()
    $selection.Font.Bold = 0
    $selection.Font.Size = 8.5
    $selection.TypeText('Lưu ý: Ảnh năm 2024 ghi tổng 22 căn nhưng đọc được 23 mã căn; giữ đủ 23 mã để đối chiếu. Ảnh năm 2025 có dòng "T6: 2" nhưng không có mã căn đi kèm nên chưa nhập.')
}

function Save-Document($Document, [string]$Path) {
    Set-PageSetup $Document
    $Document.SaveAs2($Path, 16)
    $Document.Close()
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$word = $null
$sourceDocument = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $sourceDocument = $word.Documents.Open($SourceList, $false, $true)
    $apartmentsByBlock = [ordered]@{}
    for ($tableIndex = 1; $tableIndex -le $sourceDocument.Tables.Count; $tableIndex += 2) {
        $sourceTable = $sourceDocument.Tables.Item($tableIndex)
        $apartments = [System.Collections.Generic.List[string]]::new()
        for ($row = 2; $row -le $sourceTable.Rows.Count; $row++) {
            $apartments.Add((Clean-CellText $sourceTable.Cell($row, 2).Range.Text))
        }
        $block = ($apartments[0] -split "\.")[0]
        $apartmentsByBlock[$block] = $apartments.ToArray()
    }
    $sourceDocument.Close($false)
    $sourceDocument = $null

    $allApartments = @($apartmentsByBlock.Values | ForEach-Object { $_ })
    $unknown = @(($registrations.Keys + $violations.Keys) | Select-Object -Unique | Where-Object { $_ -notin $allApartments })
    if ($unknown.Count -gt 0) {
        throw "Các căn ghi tay không có trong danh sách tầng 1: $($unknown -join ', ')"
    }

    foreach ($entry in $apartmentsByBlock.GetEnumerator()) {
        $document = $word.Documents.Add()
        Add-BlockPage $word $document $entry.Key $entry.Value $false
        Save-Document $document (Join-Path $OutputDirectory "Danh sach theo doi lap bat - Lo $($entry.Key).docx")
    }

    $combinedDocument = $word.Documents.Add()
    $isFirst = $true
    foreach ($entry in $apartmentsByBlock.GetEnumerator()) {
        Add-BlockPage $word $combinedDocument $entry.Key $entry.Value (-not $isFirst)
        $isFirst = $false
    }
    Save-Document $combinedDocument (Join-Path $OutputDirectory "Danh sach theo doi lap bat - Tat ca lo tang 1.docx")

    Get-ChildItem -LiteralPath $OutputDirectory -Filter "*.docx" |
        Sort-Object Name |
        Select-Object Name, Length, LastWriteTime
}
finally {
    if ($null -ne $sourceDocument) {
        $sourceDocument.Close($false)
    }
    if ($null -ne $word) {
        $word.Quit()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
