param(
    [string]$OutputDirectory = "E:\1. THU\BÁO CÁO\2026\Phiếu giao nhận thông báo tầng 1"
)

$ErrorActionPreference = "Stop"

$apartmentsByBlock = [ordered]@{
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

function Convert-CmToPoint([double]$Centimeters) {
    return $Centimeters * 28.3464567
}

function Set-DocumentPageSetup($Document) {
    foreach ($section in $Document.Sections) {
        $section.PageSetup.PaperSize = 7
        $section.PageSetup.Orientation = 0
        $section.PageSetup.TopMargin = Convert-CmToPoint 1.25
        $section.PageSetup.BottomMargin = Convert-CmToPoint 1.25
        $section.PageSetup.LeftMargin = Convert-CmToPoint 1.2
        $section.PageSetup.RightMargin = Convert-CmToPoint 1.2
    }
}

function Add-Paragraph($Selection, [string]$Text, [int]$Alignment, [double]$Size, [bool]$Bold, [double]$After = 0) {
    $Selection.ParagraphFormat.Alignment = $Alignment
    $Selection.ParagraphFormat.SpaceAfter = $After
    $Selection.Font.Name = "Times New Roman"
    $Selection.Font.Size = $Size
    $Selection.Font.Bold = $(if ($Bold) { -1 } else { 0 })
    $Selection.TypeText($Text)
    $Selection.TypeParagraph()
}

function Add-ChecklistSection($Word, $Document, [string]$Block, [string[]]$Apartments, [bool]$InsertPageBreak) {
    $selection = $Word.Selection

    if ($InsertPageBreak) {
        $selection.InsertBreak(7)
    }

    Add-Paragraph $selection "PHIẾU GIAO NHẬN THÔNG BÁO" 1 14 $true 2
    Add-Paragraph $selection "Về việc xử lý, giải tỏa vi phạm lấn chiếm lòng đường, vỉa hè" 1 11 $true 0
    Add-Paragraph $selection "và hành lang an toàn giao thông đường bộ" 1 11 $true 3
    Add-Paragraph $selection "LÔ: $Block" 1 12 $true 4
    Add-Paragraph $selection "Người giao: ....................................................................................    Ngày giao: ........./........./2026" 0 10 $false 2
    Add-Paragraph $selection "Người nhận ký xác nhận đã nhận được thông báo tại bảng dưới đây." 0 10 $false 4

    $headers = @("STT", "Căn hộ", "Họ và tên người nhận", "Số điện thoại", "Chữ ký xác nhận", "Ghi chú")
    $table = $Document.Tables.Add($selection.Range, $Apartments.Count + 1, $headers.Count)
    $table.Borders.Enable = 1
    $table.AllowAutoFit = $false
    $table.Rows.Item(1).HeadingFormat = -1
    $table.Rows.Item(1).HeightRule = 2
    $table.Rows.Item(1).Height = Convert-CmToPoint 0.8

    $widths = @(1.0, 1.8, 5.4, 3.0, 4.0, 2.8)
    for ($column = 1; $column -le $headers.Count; $column++) {
        $table.Columns.Item($column).Width = Convert-CmToPoint $widths[$column - 1]
        $cell = $table.Cell(1, $column)
        $cell.Range.Text = $headers[$column - 1]
        $cell.Range.Font.Name = "Times New Roman"
        $cell.Range.Font.Size = 9
        $cell.Range.Font.Bold = -1
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.VerticalAlignment = 1
    }

    for ($index = 0; $index -lt $Apartments.Count; $index++) {
        $row = $index + 2
        $table.Rows.Item($row).HeightRule = 1
        $table.Rows.Item($row).Height = Convert-CmToPoint 0.82

        $table.Cell($row, 1).Range.Text = [string]($index + 1)
        $table.Cell($row, 2).Range.Text = $Apartments[$index]

        for ($column = 1; $column -le $headers.Count; $column++) {
            $cell = $table.Cell($row, $column)
            $cell.Range.Font.Name = "Times New Roman"
            $cell.Range.Font.Size = 9
            $cell.VerticalAlignment = 1
            $cell.Range.ParagraphFormat.Alignment = $(if ($column -le 2) { 1 } else { 0 })
        }
    }

    $selection.SetRange($table.Range.End, $table.Range.End)
    $selection.TypeParagraph()
    Add-Paragraph $selection "Tổng số căn hộ trong danh sách: $($Apartments.Count) căn." 0 10 $true 5

    $signatureTable = $Document.Tables.Add($selection.Range, 1, 2)
    $signatureTable.Borders.Enable = 0
    $signatureTable.Columns.Item(1).Width = Convert-CmToPoint 9
    $signatureTable.Columns.Item(2).Width = Convert-CmToPoint 9
    $signatureTable.Cell(1, 1).Range.Text = "NGƯỜI LẬP DANH SÁCH`r`n(Ký, ghi rõ họ tên)"
    $signatureTable.Cell(1, 2).Range.Text = "NGƯỜI GIAO THÔNG BÁO`r`n(Ký, ghi rõ họ tên)"

    foreach ($cell in $signatureTable.Range.Cells) {
        $cell.Range.Font.Name = "Times New Roman"
        $cell.Range.Font.Size = 10
        $cell.Range.Font.Bold = -1
        $cell.Range.ParagraphFormat.Alignment = 1
        $cell.VerticalAlignment = 1
    }

    $selection.SetRange($signatureTable.Range.End, $signatureTable.Range.End)
}

function Save-Document($Document, [string]$Path) {
    Set-DocumentPageSetup $Document
    $Document.SaveAs2($Path, 16)
    $Document.Close()
}

New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    foreach ($entry in $apartmentsByBlock.GetEnumerator()) {
        $document = $word.Documents.Add()
        Add-ChecklistSection $word $document $entry.Key $entry.Value $false
        $path = Join-Path $OutputDirectory "Phieu giao nhan thong bao - Lo $($entry.Key).docx"
        Save-Document $document $path
    }

    $combinedDocument = $word.Documents.Add()
    $isFirst = $true
    foreach ($entry in $apartmentsByBlock.GetEnumerator()) {
        Add-ChecklistSection $word $combinedDocument $entry.Key $entry.Value (-not $isFirst)
        $isFirst = $false
    }
    $combinedPath = Join-Path $OutputDirectory "Phieu giao nhan thong bao - Tat ca lo tang 1.docx"
    Save-Document $combinedDocument $combinedPath
}
finally {
    if ($null -ne $word) {
        $word.Quit()
        [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word)
    }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

Get-ChildItem -LiteralPath $OutputDirectory -Filter "*.docx" |
    Sort-Object Name |
    Select-Object Name, Length, LastWriteTime
