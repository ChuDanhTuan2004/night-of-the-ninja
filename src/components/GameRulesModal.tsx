import React from 'react';
import { X, Shield, Sword, Eye, Award, Users } from 'lucide-react';
import { HOUSES } from '../data/cards';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div role="dialog" aria-modal="true" aria-labelledby="game-rules-title" className="bottom-sheet relative">
        <button
          onClick={onClose}
          aria-label="Đóng luật chơi"
          className="btn btn-ghost btn-icon absolute top-3 right-3"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="game-rules-title" className="phase-title mb-1 flex items-center gap-2 pr-12">
          <span>📜</span>
          <span>Luật Chơi Night of the Ninja (Đêm Của Ninja)</span>
        </h2>
        <p className="text-xs text-secondary mb-6">
          Trò chơi thẻ bài ẩn danh, chọn bài & đấu trí chiến thuật (4 - 11 người)
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-secondary">
          {/* Section 1: Objective */}
          <div className="game-card game-card-section">
            <h3 className="section-title mb-2">
              <Award className="w-5 h-5" />
              <span>1. Mục Tiêu & Cấu Trúc Trận Đấu</span>
            </h3>
            <p>
              Trận đấu diễn ra trong <strong>3 Hiệp</strong>. Mỗi hiệp bạn nhận bí mật một <strong>Thẻ Gia Tộc</strong>. Mục tiêu là giúp Gia Tộc của bạn sống sót và tích lũy điểm từ các <strong>Thẻ Danh Dự (2 - 5 điểm)</strong>. Người có tổng điểm cao nhất sau 3 Hiệp thắng cuộc!
            </p>
          </div>

          {/* Section 2: Houses */}
          <div>
            <h3 className="section-title mb-3">
              <Users className="w-5 h-5" />
              <span>2. Ba Phe Gia Tộc</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="game-card p-3">
                <div className="font-semibold text-white flex items-center space-x-1">
                  <span>🌸</span>
                  <span>Gia Tộc Hoa Sen</span>
                </div>
                <p className="text-xs text-secondary mt-1">
                  Đối đầu Chim Hạc. Cần có người Sen sống sót vào cuối hiệp để ăn điểm.
                </p>
              </div>

              <div className="game-card p-3">
                <div className="font-semibold text-white flex items-center space-x-1">
                  <span>🦩</span>
                  <span>Gia Tộc Chim Hạc</span>
                </div>
                <p className="text-xs text-secondary mt-1">
                  Đối đầu Hoa Sen. Cần có người Hạc sống sót vào cuối hiệp để ăn điểm.
                </p>
              </div>

              <div className="game-card p-3">
                <div className="font-semibold text-white flex items-center space-x-1">
                  <span>⚔️</span>
                  <span>Lãng Khách Ronin</span>
                </div>
                <p className="text-xs text-secondary mt-1">
                  Không thuộc phe nào. Thắng đậm (2 Thẻ Danh Dự) nếu sống sót duy nhất!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Phases */}
          <div className="space-y-3">
            <h3 className="section-title">
              <Sword className="w-5 h-5" />
              <span>3. Bốn Giai Đoạn Tốc Độ (Thứ Tự Xuất Chiêu)</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="game-card p-3">
                <strong className="text-white">P1 • Do Thám (Spy):</strong> Xem ngầm thẻ Gia Tộc người khác hoặc xem trước xấp bài.
              </div>

              <div className="game-card p-3">
                <strong className="text-white">P2 • Thần Thông (Mystic):</strong> Tráo đổi Gia Tộc, ép bộc lộ thân phận hoặc tráo bài.
              </div>

              <div className="game-card p-3">
                <strong className="text-white">P3 • Sát Thủ (Assassin):</strong> Tấn công và tiêu diệt mục tiêu nghi ngờ là kẻ thù!
              </div>

              <div className="game-card p-3">
                <strong className="text-white">P4 • Vệ Sĩ & Mẹo (Guard / Trickster):</strong> Dùng Khiên đỡ đòn, Độn thổ né đòn, Trả thù khi chết hoặc cướp Thẻ Danh Dự.
              </div>
            </div>
          </div>

          {/* Section 4: Scoring */}
          <div className="game-card game-card-section">
            <h3 className="section-title mb-1">
              4. Tính Điểm & Trao Thẻ Danh Dự
            </h3>
            <ul className="list-disc list-inside text-xs text-secondary space-y-1">
              <li>Mỗi người sống sót thuộc Gia Tộc thắng hiệp được rút 1 Thẻ Danh Dự.</li>
              <li>Sát thủ ám sát bằng [Phi Tiêu Độc] nhận thêm 1 Thẻ Danh Dự bonus.</li>
              <li>Các Thẻ Danh Dự có giá trị ngẫu nhiên từ 2 đến 5 điểm. Cuối 3 Hiệp ai cao điểm nhất sẽ chiến thắng!</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="btn btn-primary"
          >
            Đã Hiểu • Sẵn Sàng Chiến Đấu!
          </button>
        </div>
      </div>
    </div>
  );
};
