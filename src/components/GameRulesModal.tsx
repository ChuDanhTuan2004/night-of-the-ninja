import React from 'react';
import { Award, Sword, Users, X } from 'lucide-react';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameRulesModal: React.FC<GameRulesModalProps> = ({ isOpen, onClose }) => {
  React.useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div role="dialog" aria-modal="true" aria-labelledby="game-rules-title" className="bottom-sheet relative">
        <button onClick={onClose} aria-label="Đóng luật chơi" className="btn btn-ghost btn-icon absolute top-3 right-3">
          <X className="w-5 h-5" />
        </button>

        <h2 id="game-rules-title" className="phase-title mb-1 pr-12">📜 Luật Night of the Ninja</h2>
        <p className="text-xs text-secondary mb-6">4–11 người · 33 Ninja cards · thắng khi đạt ít nhất 10 Honor</p>

        <div className="space-y-5 text-sm leading-relaxed text-secondary">
          <section className="game-card game-card-section">
            <h3 className="section-title mb-2"><Award className="w-5 h-5" /> Mục tiêu</h3>
            <p>Giúp House hiện tại của bạn thắng từng hiệp và thu Honor token. Cuối hiệp, nếu có người đạt <strong>10 điểm trở lên</strong>, người có tổng điểm cao nhất thắng; bằng điểm thì cùng thắng.</p>
          </section>

          <section className="status-panel">
            <h3 className="section-title mb-2">🃏 Draft 3 → 2 lá</h3>
            <p>Nhận 3 lá, giữ 1 và chuyển 2 lá sang trái. Nhận 2 lá từ bên phải, giữ 1; lá còn lại vào chồng bài bỏ. Grave Digger có thể lấy lại một trong hai lá trên chồng này.</p>
          </section>

          <section>
            <h3 className="section-title mb-3"><Users className="w-5 h-5" /> House và rank</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="game-card p-3"><strong className="text-white">🌸 Hoa Sen</strong><p>Đấu với Chim Hạc. Rank 1 mạnh hơn 2, rồi 3…</p></div>
              <div className="game-card p-3"><strong className="text-white">🪽 Chim Hạc</strong><p>Đấu với Hoa Sen. So từng survivor từ rank cao nhất.</p></div>
              <div className="game-card p-3"><strong className="text-white">⚔️ Ronin</strong><p>Nếu sống tới House Reveal, nhận 1 Honor bất kể House thắng.</p></div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="section-title"><Sword className="w-5 h-5" /> Năm phase trong Đêm</h3>
            <div className="space-y-2 text-xs">
              <div className="game-card p-3"><strong className="text-white">1 · Spy:</strong> xem riêng House của một người khác.</div>
              <div className="game-card p-3"><strong className="text-white">2 · Mystic:</strong> xem House và ngẫu nhiên 1 Ninja card chưa chơi của mục tiêu.</div>
              <div className="game-card p-3"><strong className="text-white">3 · Trickster:</strong> Shapeshifter → Grave Digger → Troublemaker → Spirit Merchant → Thief → Judge.</div>
              <div className="game-card p-3"><strong className="text-white">4 · Blind Assassin:</strong> chọn và giết mà không xem House trước.</div>
              <div className="game-card p-3"><strong className="text-white">5 · Shinobi:</strong> xem House rồi chọn giết hoặc tha.</div>
            </div>
            <p className="text-xs">Trong mỗi phase, lá được resolve theo priority <strong>1 → 6</strong>. Người đã chết không thực hiện hành động mới và không lật House ở House Reveal.</p>
          </section>

          <section className="game-card game-card-section">
            <h3 className="section-title mb-2">✨ Ba lá Special</h3>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li><strong>Mirror Monk:</strong> phản kill của Blind Assassin/Shinobi; chủ lá sống, kẻ tấn công chết.</li>
              <li><strong>Martyr:</strong> vẫn chết bởi hai nguồn trên nhưng nhận 1 Honor token.</li>
              <li><strong>Mastermind:</strong> nếu còn sống ở House Reveal, ép House hiện tại thắng; Ronin ép kết quả không House thắng.</li>
              <li>Mirror Monk và Martyr <strong>không</strong> phản ứng với Judge.</li>
            </ul>
          </section>

          <section className="game-card game-card-section">
            <h3 className="section-title mb-2">🏆 House Reveal và thưởng</h3>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>Chỉ người sống lật House. So dãy rank survivor tăng dần; số nhỏ hơn thắng, còn dư rank thì House đó thắng.</li>
              <li>Nếu hai dãy hoàn toàn bằng nhau, mỗi người còn sống nhận 1 Honor token.</li>
              <li>Nếu Hoa Sen hoặc Chim Hạc thắng, mọi thành viên House đó nhận 1 token, kể cả người đã chết.</li>
            </ul>
          </section>
        </div>

        <div className="mt-6 text-center"><button onClick={onClose} className="btn btn-primary">Đã hiểu</button></div>
      </div>
    </div>
  );
};
