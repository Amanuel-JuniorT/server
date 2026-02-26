
$file = 'storage/logs/laravel.log';
$size = (Get-Item $file).Length;
$start = [Math]::Max(0, $size - 4000);
$stream = [System.IO.File]::OpenRead($file);
$stream.Seek($start, [System.IO.SeekOrigin]::Begin);
$reader = New-Object System.IO.StreamReader($stream);
echo $reader.ReadToEnd();
$stream.Close();
