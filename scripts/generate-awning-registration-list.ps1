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

$fallbackApartmentsByBlock = [ordered]@{
    "L1" = @(
        "L1.101", "L1.102", "L1.103", "L1.105", "L1.106A", "L1.106B", "L1.107", "L1.108",
        "L1.109", "L1.110", "L1.111A", "L1.111B", "L1.112", "L1.114", "L1.115", "L1.116",
        "L1.117", "L1.118", "L1.119", "L1.120", "L1.121", "L1.122", "L1.123", "L1.124"
    )
    "L2" = @(
        "L2.101", "L2.102", "L2.103", "L2.105", "L2.106A", "L2.106B", "L2.107", "L2.108",
        "L2.109", "L2.110", "L2.111A", "L2.111B", "L2.112", "L2.114", "L2.115", "L2.116",
        "L2.117", "L2.118", "L2.119", "L2.120", "L2.121", "L2.122", "L2.123", "L2.124",
        "L2.125", "L2.126", "L2.127", "L2.128", "L2.129", "L2.130", "L2.131", "L2.132"
    )
    "L3" = @(
        "L3.101", "L3.102", "L3.103", "L3.105", "L3.106A", "L3.106B", "L3.107", "L3.108",
        "L3.109", "L3.110", "L3.111A", "L3.111B", "L3.112", "L3.114", "L3.115", "L3.116"
    )
    "L4A" = @(
        "L4A.101", "L4A.102", "L4A.103", "L4A.105", "L4A.106A", "L4A.106B", "L4A.107", "L4A.108",
        "L4A.109", "L4A.110", "L4A.111A", "L4A.111B", "L4A.112", "L4A.114", "L4A.115", "L4A.116",
        "L4A.117", "L4A.118", "L4A.119", "L4A.120", "L4A.121", "L4A.122", "L4A.123", "L4A.124",
        "L4A.125", "L4A.126", "L4A.127", "L4A.128", "L4A.129", "L4A.130", "L4A.131", "L4A.132",
        "L4A.133", "L4A.134", "L4A.135", "L4A.136"
    )
    "L4B" = @(
        "L4B.101", "L4B.102", "L4B.103", "L4B.105", "L4B.106A", "L4B.106B", "L4B.107", "L4B.108",
        "L4B.109", "L4B.110", "L4B.111A", "L4B.111B", "L4B.112", "L4B.114", "L4B.115", "L4B.116",
        "L4B.117", "L4B.118", "L4B.119", "L4B.120", "L4B.121", "L4B.122", "L4B.123", "L4B.124",
        "L4B.125", "L4B.126", "L4B.127", "L4B.128", "L4B.129", "L4B.130", "L4B.131", "L4B.132",
        "L4B.133", "L4B.134", "L4B.135", "L4B.136"
    )
    "L4C" = @(
        "L4C.101", "L4C.102", "L4C.103", "L4C.105", "L4C.106A", "L4C.106B", "L4C.107", "L4C.108",
        "L4C.109", "L4C.110", "L4C.111A", "L4C.111B", "L4C.112", "L4C.114", "L4C.115", "L4C.116",
        "L4C.117", "L4C.118", "L4C.119", "L4C.120", "L4C.121", "L4C.122", "L4C.123", "L4C.124",
        "L4C.125", "L4C.126", "L4C.127", "L4C.128", "L4C.129", "L4C.130", "L4C.131", "L4C.132",
        "L4C.133", "L4C.134", "L4C.135", "L4C.136"
    )
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

    $apartmentsByBlock = [ordered]@{}
    if (Test-Path -LiteralPath $SourceList) {
        $sourceDocument = $word.Documents.Open($SourceList, $false, $true)
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
    }
    else {
        foreach ($entry in $fallbackApartmentsByBlock.GetEnumerator()) {
            $apartmentsByBlock[$entry.Key] = $entry.Value
        }
    }

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
