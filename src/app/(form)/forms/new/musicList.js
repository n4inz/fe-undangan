import { useState, useEffect, useCallback } from 'react';
import DataTable from 'react-data-table-component';
import { DebounceInput } from 'react-debounce-input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const formatTime = (seconds) => {
  if (isNaN(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const MusicList = ({ currentlyPlaying, setCurrentlyPlaying, audioRef, onSongSelected, selectedSongId: initialSelectedSongId }) => {
  const [data, setData] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSongId, setSelectedSongId] = useState(initialSelectedSongId); // State untuk radio button
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetchData(currentPage, perPage, search);
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentPage, perPage, search]);

  const fetchData = useCallback(async (page, limit, searchQuery) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/music`, {
        params: { page, limit, search: searchQuery },
        withCredentials: true,
      });
      setData(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, []);

  const handlePlay = (id, file) => {
    if (currentlyPlaying === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentlyPlaying(null);
      setCurrentTime(0);
      setDuration(0);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setCurrentlyPlaying(id);
      setCurrentTime(0);
      setDuration(0);

      audioRef.current = new Audio(`${process.env.NEXT_PUBLIC_API_URL}/music/${file}`);
      audioRef.current.play();

      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });

      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current.currentTime);
      });

      audioRef.current.onended = () => {
        setCurrentlyPlaying(null);
        setCurrentTime(0);
        setDuration(0);
      };
    }
  };

  const handleSearch = (event) => {
    setSearch(event.target.value);
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const handlePerRowsChange = async (newPerPage, page) => {
    setPerPage(newPerPage);
    fetchData(page, newPerPage);
  };

  const handleRadioChange = (value) => {
    setSelectedSongId(value); // Update state local
    onSongSelected?.(value);  // Kirim ke parent (jika callback tersedia)
  };

  const columns = [
    {
      name: 'Select',
      cell: row => (
        // Radio button untuk memilih lagu (hanya memilih, tidak memainkan)
        <RadioGroupItem value={row.id.toString()} />
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '56px',
    },
    {
      name: 'Music',
      cell: row => (
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handlePlay(row.id, row.file)}
          >
            {currentlyPlaying === row.id ? '⏹ Stop' : '▶ Play'}
          </Button>

          {currentlyPlaying === row.id && (
            <div className="flex flex-col gap-1 w-full">
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={(e) => {
                  const newTime = parseFloat(e.target.value);
                  setCurrentTime(newTime);
                  audioRef.current.currentTime = newTime;
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      name: 'Name',
      selector: row => row.name,
      sortable: true,
      wrap: true,
    },
  ];

  return (
    // RadioGroup dikontrol secara independen; onValueChange hanya mengubah state tanpa trigger playback
    <RadioGroup
      value={selectedSongId}
      onValueChange={handleRadioChange} // Gunakan handler gabungan
    >
      <div className="w-full">
        <DebounceInput
          minLength={2}
          debounceTimeout={300}
          placeholder="Search"
          value={search}
          onChange={handleSearch}
          className="border border-gray-300 rounded-md p-2 w-1/2"
        />
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={data}
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            onChangePage={handlePageChange}
            // onChangeRowsPerPage={handlePerRowsChange}
            paginationRowsPerPageOptions={[10]} // Disable rows-per-page dropdown
            className="rdt_TableCol w-full"
          />
        </div>
      </div>
    </RadioGroup>
  );
};

export default MusicList;
