import React from 'react';
import { X, Shield, Sword, Eye, Award, Users } from 'lucide-react';
import { HOUSES } from '../data/cards';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-amber-600/40 rounded-2xl p-6 shadow-2xl text-slate-200 relative my-8 max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold font-serif text-amber-300 mb-1 flex items-center space-x-2">
          <span>📜</span>
          <span>Luật Chơi Night of the Ninja (Đêm Của Ninja)</span>
        </h2>
        <p className="text-xs text-amber-400/70 font-mono mb-6">
          Trò chơi thẻ bài ẩn danh, chọn bài & đấu trí chiến thuật (4 - 11 người)
        </p>

        <div className="space-y-6 text-sm leading-relaxed">
          {/* Section 1: Objective */}
          <div className="bg-slate-950/60 rounded-xl p-4 border border-amber-900/30">
            <h3 className="font-bold text-amber-200 font-serif text-base mb-2 flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>1. Mục Tiêu & Cấu Trúc Trận Đấu</span>
            </h3>
            <p className="text-slate-300">
              Trận đấu diễn ra trong <strong className="text-amber-300">3 Hiệp</strong>. Mỗi hiệp bạn nhận bí mật một <strong className="text-amber-300">Thẻ Gia Tộc</strong>. Mục tiêu là giúp Gia Tộc của bạn sống sót và tích lũy điểm từ các <strong className="text-amber-300">Thẻ Danh Dự (2 - 5 điểm)</strong>. Người có tổng điểm cao nhất sau 3 Hiệp thắng cuộc!
            </p>
          </div>

          {/* Section 2: Houses */}
          <div>
            <h3 className="font-bold text-amber-200 font-serif text-base mb-3 flex items-center space-x-2">
              <Users className="w-4 h-4 text-rose-400" />
              <span>2. Ba Phe Gia Tộc</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-rose-950/40 border border-rose-500/30 rounded-lg p-3">
                <div className="font-bold text-rose-300 flex items-center space-x-1">
                  <span>🌸</span>
                  <span>Gia Tộc Hoa Sen</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Đối đầu Chim Hạc. Cần có người Sen sống sót vào cuối hiệp để ăn điểm.
                </p>
              </div>

              <div className="bg-sky-950/40 border border-sky-500/30 rounded-lg p-3">
                <div className="font-bold text-sky-300 flex items-center space-x-1">
                  <span>🦩</span>
                  <span>Gia Tộc Chim Hạc</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Đối đầu Hoa Sen. Cần có người Hạc sống sót vào cuối hiệp để ăn điểm.
                </p>
              </div>

              <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3">
                <div className="font-bold text-amber-300 flex items-center space-x-1">
                  <span>⚔️</span>
                  <span>Lãng Khách Ronin</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Không thuộc phe nào. Thắng đậm (2 Thẻ Danh Dự) nếu sống sót duy nhất!
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Phases */}
          <div className="space-y-3">
            <h3 className="font-bold text-amber-200 font-serif text-base flex items-center space-x-2">
              <Sword className="w-4 h-4 text-amber-400" />
              <span>3. Bốn Giai Đoạn Tốc Độ (Thứ Tự Xuất Chiêu)</span>
            </h3>

            <div className="space-y-2 font-sans text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                <strong className="text-emerald-300 font-mono">P1 • Do Thám (Spy):</strong> Xem ngầm thẻ Gia Tộc người khác hoặc xem trước xấp bài.
              </div>

              <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30">
                <strong className="text-indigo-300 font-mono">P2 • Thần Thông (Mystic):</strong> Tráo đổi Gia Tộc, ép bộc lộ thân phận hoặc tráo bài.
              </div>

              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/30">
                <strong className="text-rose-300 font-mono">P3 • Sát Thủ (Assassin):</strong> Tấn công và tiêu diệt mục tiêu nghi ngờ là kẻ thù!
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30">
                <strong className="text-amber-300 font-mono">P4 • Vệ Sĩ & Mẹo (Guard / Trickster):</strong> Dùng Khiên đỡ đòn, Độn thổ né đòn, Trả thù khi chết hoặc cướp Thẻ Danh Dự.
              </div>
            </div>
          </div>

          {/* Section 4: Scoring */}
          <div className="bg-amber-950/30 rounded-xl p-4 border border-amber-600/30">
            <h3 className="font-bold text-amber-300 font-serif text-base mb-1">
              4. Tính Điểm & Trao Thẻ Danh Dự
            </h3>
            <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
              <li>Mỗi người sống sót thuộc Gia Tộc thắng hiệp được rút 1 Thẻ Danh Dự.</li>
              <li>Sát thủ ám sát bằng [Phi Tiêu Độc] nhận thêm 1 Thẻ Danh Dự bonus.</li>
              <li>Các Thẻ Danh Dự có giá trị ngẫu nhiên từ 2 đến 5 điểm. Cuối 3 Hiệp ai cao điểm nhất sẽ chiến thắng!</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold font-serif hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg"
          >
            Đã Hiểu • Sẵn Sàng Chiến Đấu!
          </button>
        </div>
      </div>
    </div>
  );
};
